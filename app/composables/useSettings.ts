export function useSettings() {
  const backend = useBackend()
  return { get: backend.getSettings, update: backend.updateSettings, changeEpfRate: backend.changeEpfRate }
}
