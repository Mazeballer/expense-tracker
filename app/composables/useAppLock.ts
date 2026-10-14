type LockData = { enabled: boolean; salt: string; hash: string; credentialId: string | null; fails: number }

const EMPTY: LockData = { enabled: false, salt: '', hash: '', credentialId: null, fails: 0 }
const MAX_FAILS = 5
const encoder = new TextEncoder()

const toB64 = (buf: ArrayBuffer | Uint8Array) => btoa(String.fromCharCode(...new Uint8Array(buf)))
const fromB64 = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0))
const randomBytes = (n: number) => crypto.getRandomValues(new Uint8Array(n))

async function hashPin(pin: string, salt: string): Promise<string> {
  const key = await crypto.subtle.importKey('raw', encoder.encode(pin), 'PBKDF2', false, ['deriveBits'])
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: fromB64(salt), iterations: 150_000, hash: 'SHA-256' }, key, 256)
  return toB64(bits)
}

export const isStandalone = () =>
  import.meta.client && (window.matchMedia('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true)

export function useAppLock() {
  const data = useLocalStorage<LockData>('app-lock', { ...EMPTY }, { mergeDefaults: true })
  const { signedIn, signOut } = useAuth()
  const locked = useState('app-locked', () => data.value.enabled && isStandalone())
  const graceUntil = useState('app-lock-grace', () => 0)
  const biometricSupported = useState('app-lock-biometric-supported', () => false)

  const standalone = computed(() => isStandalone())
  const enabled = computed(() => data.value.enabled)
  const hasBiometric = computed(() => data.value.credentialId !== null)
  const active = computed(() => data.value.enabled && standalone.value && signedIn.value)

  onMounted(async () => {
    biometricSupported.value = typeof PublicKeyCredential !== 'undefined'
      && (await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable().catch(() => false))
  })

  async function setPin(pin: string) {
    const salt = toB64(randomBytes(16))
    data.value = { ...data.value, enabled: true, salt, hash: await hashPin(pin, salt), fails: 0 }
  }

  async function unlockWithPin(pin: string): Promise<{ ok: boolean; triesLeft: number }> {
    const ok = (await hashPin(pin, data.value.salt)) === data.value.hash
    if (ok) {
      data.value = { ...data.value, fails: 0 }
      locked.value = false
      return { ok: true, triesLeft: MAX_FAILS }
    }
    const fails = data.value.fails + 1
    data.value = { ...data.value, fails }
    if (fails >= MAX_FAILS) {
      reset()
      await signOut()
    }
    return { ok: false, triesLeft: Math.max(MAX_FAILS - fails, 0) }
  }

  async function enableBiometric(): Promise<boolean> {
    try {
      const credential = await navigator.credentials.create({
        publicKey: {
          challenge: randomBytes(32),
          rp: { name: 'Wallet Wyse' },
          user: { id: randomBytes(16), name: 'app-lock', displayName: 'App lock' },
          pubKeyCredParams: [{ type: 'public-key', alg: -7 }, { type: 'public-key', alg: -257 }],
          authenticatorSelection: { authenticatorAttachment: 'platform', userVerification: 'required', residentKey: 'preferred' },
          attestation: 'none',
          timeout: 60_000,
        },
      }) as PublicKeyCredential | null
      if (!credential) return false
      data.value = { ...data.value, credentialId: toB64(credential.rawId) }
      return true
    } catch {
      return false
    }
  }

  async function unlockWithBiometric(): Promise<boolean> {
    if (!data.value.credentialId) return false
    try {
      const result = await navigator.credentials.get({
        publicKey: {
          challenge: randomBytes(32),
          allowCredentials: [{ type: 'public-key', id: fromB64(data.value.credentialId), transports: ['internal'] }],
          userVerification: 'required',
          timeout: 60_000,
        },
      })
      if (!result) return false
      locked.value = false
      return true
    } catch {
      return false
    }
  }

  const disableBiometric = () => { data.value = { ...data.value, credentialId: null } }
  const reset = () => { data.value = { ...EMPTY }; locked.value = false }
  const grace = (ms = 60_000) => { graceUntil.value = Date.now() + ms }

  return { enabled, active, locked, standalone, hasBiometric, biometricSupported, setPin, unlockWithPin, enableBiometric, unlockWithBiometric, disableBiometric, reset, grace, graceUntil }
}

export function useAppLockWatcher() {
  const lock = useAppLock()
  useEventListener(document, 'visibilitychange', () => {
    if (document.visibilityState === 'hidden' && lock.active.value && Date.now() > lock.graceUntil.value) lock.locked.value = true
  })
}
