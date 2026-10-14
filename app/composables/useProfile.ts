import { toast } from 'vue-sonner'
import { squareAvatar } from '~/lib/image'

const MOCK_FIRST_NAME = 'Darryl'
const MAX_PHOTO_BYTES = 15 * 1024 * 1024

export function useProfile() {
  const { user } = useAuth()
  const googleName = computed(() => {
    const full = String(user.value?.user_metadata?.name ?? user.value?.user_metadata?.full_name ?? '').trim()
    return full ? full.split(' ')[0]! : null
  })
  const mockName = useRuntimeConfig().public.useMock ? MOCK_FIRST_NAME : null
  const firstName = computed(() => mockName ?? googleName.value)
  const avatarUrl = useLocalStorage<string>('profile-avatar', '')

  async function setAvatar(file: File) {
    if (!file.type.startsWith('image/')) return toast.error('Choose an image file.')
    if (file.size > MAX_PHOTO_BYTES) return toast.error('That photo is too large. Choose one under 15 MB.')
    try {
      avatarUrl.value = await squareAvatar(file)
      toast.success('Photo updated')
    } catch {
      toast.error('Could not read that image. Try a different photo.')
    }
  }

  function clearAvatar() {
    avatarUrl.value = ''
    toast.success('Photo removed')
  }

  return { firstName, avatarUrl, setAvatar, clearAvatar }
}
