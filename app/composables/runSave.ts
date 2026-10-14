import { toast } from 'vue-sonner'

export async function runSave(action: () => Promise<unknown>, success: string): Promise<boolean> {
  try {
    await action()
    toast.success(success)
    bumpData()
    return true
  } catch {
    toast.error('Could not save. Your changes are still here. Try again.')
    return false
  }
}
