const SUPPORTED_PROTOCOLS = new Set(['http:', 'https:', 'data:'])

export const isSupportedTextureUrl = (value) => {
  const url = typeof value === 'string' ? value.trim() : ''
  if (!url) return false
  if (url.startsWith('/')) return true

  try {
    return SUPPORTED_PROTOCOLS.has(new URL(url).protocol)
  } catch {
    return false
  }
}
