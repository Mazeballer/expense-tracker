// Private tokens for the iPhone Shortcut. The token is made here, shown once, and only its hash is saved.
const toHex = (bytes: ArrayBuffer) => [...new Uint8Array(bytes)].map((b) => b.toString(16).padStart(2, '0')).join('')

export function useApiTokens() {
  const backend = useBackend()
  return {
    list: backend.listApiTokens,
    remove: backend.removeApiToken,
    async create(label: string): Promise<string> {
      const random = crypto.getRandomValues(new Uint8Array(32))
      const token = `wwk_${[...random].map((b) => b.toString(16).padStart(2, '0')).join('')}`
      const hash = toHex(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token)))
      await backend.addApiToken(label, hash)
      return token
    },
  }
}
