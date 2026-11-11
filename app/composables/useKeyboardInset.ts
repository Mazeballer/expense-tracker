// How much of the bottom of the screen the on-screen keyboard covers, and how tall the part you can still see is.
// A sheet fixed to the bottom of the page stays behind the keyboard on iPhone, so sheets lift themselves by this much.
export function useKeyboardInset() {
  const inset = ref(0)
  const visibleHeight = ref(0)

  onMounted(() => {
    const vv = window.visualViewport
    if (!vv) return
    const update = () => {
      inset.value = Math.max(0, Math.round(window.innerHeight - vv.offsetTop - vv.height))
      visibleHeight.value = Math.round(vv.height)
    }
    update()
    vv.addEventListener('resize', update)
    vv.addEventListener('scroll', update)
    onBeforeUnmount(() => {
      vv.removeEventListener('resize', update)
      vv.removeEventListener('scroll', update)
    })
  })

  return { inset, visibleHeight }
}
