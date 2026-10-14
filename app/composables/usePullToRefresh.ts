const THRESHOLD = 70
const MAX_PULL = 110

export function usePullToRefresh(onRefresh: () => Promise<unknown> | unknown) {
  const pull = ref(0)
  const refreshing = ref(false)
  const isDesktop = useIsDesktop()
  let startY = 0
  let tracking = false

  const blocked = () => isDesktop.value || refreshing.value || !!document.querySelector('[role="dialog"]')

  useEventListener('touchstart', (ev: TouchEvent) => {
    if (blocked() || window.scrollY > 0) return
    startY = ev.touches[0]!.clientY
    tracking = true
  }, { passive: true })

  useEventListener('touchmove', (ev: TouchEvent) => {
    if (!tracking) return
    const dy = ev.touches[0]!.clientY - startY
    if (dy <= 0 || window.scrollY > 0) {
      pull.value = 0
      return
    }
    pull.value = Math.min(dy * 0.5, MAX_PULL)
    if (ev.cancelable) ev.preventDefault()
  }, { passive: false })

  useEventListener('touchend', async () => {
    if (!tracking) return
    tracking = false
    if (pull.value >= THRESHOLD) {
      refreshing.value = true
      pull.value = THRESHOLD
      try {
        await Promise.all([onRefresh(), new Promise((resolve) => setTimeout(resolve, 600))])
      } finally {
        refreshing.value = false
        pull.value = 0
      }
    } else {
      pull.value = 0
    }
  })

  return { pull, refreshing, threshold: THRESHOLD }
}
