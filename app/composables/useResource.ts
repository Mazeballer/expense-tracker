import { toast } from 'vue-sonner'
import type { Ref, WatchSource } from 'vue'

export const useDataVersion = () => useState('data-version', () => 0)
export const bumpData = () => { useDataVersion().value++ }

export function useResource<T>(fetcher: () => Promise<T>, deps: WatchSource[] = []) {
  const version = useDataVersion()
  const data = ref<T | null>(null) as Ref<T | null>
  const loading = ref(true)
  const error = ref(false)
  let latest = 0

  async function load(silent = false) {
    const mine = ++latest
    if (!silent) {
      loading.value = data.value === null
      error.value = false
    }
    try {
      const result = await fetcher()
      if (mine === latest) data.value = result
    } catch {
      if (mine === latest && !silent) error.value = true
    } finally {
      if (mine === latest) loading.value = false
    }
  }

  let seenActive = false
  onActivated(() => {
    if (seenActive) load(true)
    seenActive = true
  })

  watch(deps, () => load(), { immediate: true })
  watch(version, () => load(true))

  async function mutate(
    apply: (current: T) => T,
    run: () => Promise<unknown>,
    messages: { success: string; failure?: string },
  ) {
    const snapshot = data.value
    if (snapshot !== null) data.value = apply(snapshot)
    try {
      await run()
      toast.success(messages.success)
      bumpData()
    } catch {
      data.value = snapshot
      toast.error(messages.failure ?? 'Could not save. Try again.')
    }
  }

  return { data, loading, error, reload: () => load(), mutate }
}
