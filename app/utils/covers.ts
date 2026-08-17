export function coverUrl(coverId: number | undefined | null, size: 'S' | 'M' | 'L' = 'M'): string | null {
  if (!coverId) return null
  return `https://covers.openlibrary.org/b/id/${coverId}-${size}.jpg`
}

export function workIdFromKey(key: string): string {
  return key.replace('/works/', '')
}
