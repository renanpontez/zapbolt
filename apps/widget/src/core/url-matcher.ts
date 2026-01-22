export interface UrlPattern {
  pattern: string;
  type: 'include' | 'exclude';
}

/**
 * Convert a URL pattern (with wildcards) to a RegExp
 * Supports:
 * - * for any characters within a path segment
 * - ** for any characters including path separators
 * - ? for a single character
 */
function patternToRegExp(pattern: string): RegExp {
  // Escape special regex characters except * and ?
  let regexPattern = pattern
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')
    // Replace ** with a placeholder
    .replace(/\*\*/g, '{{DOUBLE_STAR}}')
    // Replace * with match any except /
    .replace(/\*/g, '[^/]*')
    // Replace ? with match single character
    .replace(/\?/g, '.')
    // Replace placeholder with match anything
    .replace(/\{\{DOUBLE_STAR\}\}/g, '.*');

  return new RegExp(`^${regexPattern}$`, 'i');
}

/**
 * Check if a URL matches a pattern
 */
export function matchesPattern(url: string, pattern: string): boolean {
  try {
    const regex = patternToRegExp(pattern);
    return regex.test(url);
  } catch {
    console.warn(`[Zapbolt] Invalid URL pattern: ${pattern}`);
    return false;
  }
}

/**
 * Check if the current URL should show the widget based on include/exclude patterns
 */
export function shouldShowWidget(currentUrl: string, patterns: UrlPattern[]): boolean {
  // If no patterns, show everywhere
  if (!patterns || patterns.length === 0) {
    return true;
  }

  const includePatterns = patterns.filter((p) => p.type === 'include');
  const excludePatterns = patterns.filter((p) => p.type === 'exclude');

  // First check exclude patterns - if any match, don't show
  for (const { pattern } of excludePatterns) {
    if (matchesPattern(currentUrl, pattern)) {
      return false;
    }
  }

  // If there are include patterns, at least one must match
  if (includePatterns.length > 0) {
    for (const { pattern } of includePatterns) {
      if (matchesPattern(currentUrl, pattern)) {
        return true;
      }
    }
    return false;
  }

  // No include patterns and no exclude patterns matched
  return true;
}

/**
 * Get the current page URL (without hash)
 */
export function getCurrentUrl(): string {
  const { protocol, host, pathname, search } = window.location;
  return `${protocol}//${host}${pathname}${search}`;
}
