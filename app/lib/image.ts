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

// Shrinks a receipt photo and returns it as a JPEG data URL.
// The AI is limited by how many tokens one request may use per minute, and a photo costs about one token per 28x28 pixels.
// So the size is capped by total pixels (about 4000 tokens), not by the long side alone.
const MAX_PIXELS = 3_000_000

export async function receiptDataUrl(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file)
  let scale = Math.min(1, Math.sqrt(MAX_PIXELS / (bitmap.width * bitmap.height)))
  let url = ''
  for (let attempt = 0; attempt < 3; attempt++) {
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(bitmap.width * scale)
    canvas.height = Math.round(bitmap.height * scale)
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Canvas is not available')
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    url = canvas.toDataURL('image/jpeg', 0.85)
    if (url.length < 3_000_000) break
    scale *= 0.8
  }
  bitmap.close()
  return url
}
