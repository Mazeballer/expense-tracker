export async function squareAvatar(file: File, size = 256): Promise<string> {
  const bitmap = await createImageBitmap(file)
  const side = Math.min(bitmap.width, bitmap.height)
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas is not available')
  ctx.drawImage(bitmap, (bitmap.width - side) / 2, (bitmap.height - side) / 2, side, side, 0, 0, size, size)
  bitmap.close()
  return canvas.toDataURL('image/jpeg', 0.85)
}

// Shrinks a receipt photo so it uploads fast and fits the limits, and returns it as a JPEG data URL.
// Kept large on purpose: a receipt held up in a busy scene is only a small part of the photo, and tiny text cannot be read.
export async function receiptDataUrl(file: File, maxSide = 2400): Promise<string> {
  const bitmap = await createImageBitmap(file)
  let side = maxSide
  let url = ''
  for (let attempt = 0; attempt < 3; attempt++) {
    const scale = Math.min(1, side / Math.max(bitmap.width, bitmap.height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(bitmap.width * scale)
    canvas.height = Math.round(bitmap.height * scale)
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Canvas is not available')
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    url = canvas.toDataURL('image/jpeg', 0.85)
    if (url.length < 3_000_000) break
    side = Math.round(side * 0.8)
  }
  bitmap.close()
  return url
}
