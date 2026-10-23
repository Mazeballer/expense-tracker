import { toast } from 'vue-sonner'
import { squareAvatar } from '~/lib/image'

const MOCK_FIRST_NAME = 'Darryl'
const MAX_PHOTO_BYTES = 15 * 1024 * 1024

export function useProfile() {
  const { user } = useAuth()
  const backend = useBackend()
  const googleName = computed(() => {
    const full = String(user.value?.user_metadata?.name ?? user.value?.user_metadata?.full_name ?? '').trim()
    return full ? full.split(' ')[0]! : null
  })
  const mockName = useRuntimeConfig().public.useMock ? MOCK_FIRST_NAME : null
  const firstName = computed(() => mockName ?? googleName.value)
  // The photo lives in Supabase. This copy on the device only makes it appear instantly and work offline.
  const avatarUrl = useLocalStorage<string>('profile-avatar', '')

  // Once per visit: take the saved photo from Supabase. A photo that only exists on this device (from before) is uploaded.
  const synced = useState('avatar-synced', () => false)
  async function sync() {
    if (synced.value || !user.value) return
    synced.value = true
    try {
      const remote = await backend.getAvatar()
      if (remote) avatarUrl.value = remote
      else if (avatarUrl.value) await backend.setAvatar(avatarUrl.value)
    } catch {
      synced.value = false
    }
  }
  if (import.meta.client) watch(user, sync, { immediate: true })

  async function setAvatar(file: File) {
    if (!file.type.startsWith('image/')) return toast.error('Choose an image file.')
    if (file.size > MAX_PHOTO_BYTES) return toast.error('That photo is too large. Choose one under 15 MB.')
    let small: string
    try {
      small = await squareAvatar(file)
    } catch {
      return toast.error('Could not read that image. Try a different photo.')
    }
    avatarUrl.value = small
    try {
      await backend.setAvatar(small)
      toast.success('Photo updated')
    } catch {
      toast.error('Saved on this device only. Could not upload it. Try again.')
    }
  }

  async function clearAvatar() {
    avatarUrl.value = ''
    try {
      await backend.removeAvatar()
      toast.success('Photo removed')
    } catch {
      toast.error('Removed here, but could not remove the saved copy. Try again.')
    }
  }

  return { firstName, avatarUrl, setAvatar, clearAvatar }
}
