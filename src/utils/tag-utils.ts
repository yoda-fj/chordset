/**
 * Parse tags from various formats (JSON string, array, or undefined)
 */
export function parseTags(tags: unknown): string[] {
  if (Array.isArray(tags)) {
    return tags.filter((t): t is string => typeof t === 'string')
  }
  if (typeof tags === 'string') {
    try {
      const parsed = JSON.parse(tags)
      if (Array.isArray(parsed)) {
        return parsed.filter((t): t is string => typeof t === 'string')
      }
    } catch {
      return []
    }
  }
  return []
}

/**
 * Stringify tags for storage
 */
export function stringifyTags(tags: string[] | undefined): string {
  return JSON.stringify(tags || [])
}