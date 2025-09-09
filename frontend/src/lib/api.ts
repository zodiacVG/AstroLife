function resolveApiBase(): string {
  // 1) Explicit env has highest priority
  const envUrl = (import.meta as any)?.env?.VITE_API_URL as string | undefined
  if (envUrl) return envUrl

  // 2) Browser context heuristics
  if (typeof window !== 'undefined') {
    const host = window.location.hostname
    const proto = window.location.protocol
    // If we're on localhost/127.0.0.1, use that host directly
    if (host === 'localhost' || host === '127.0.0.1') {
      return `${proto}//${host}:8000`
    }
    // Otherwise, default to localhost to avoid unreachable private IPs
    // (e.g., 172.29.x.x from container networks)
    // Tip: set VITE_API_URL to your backend URL in non-local envs.
    if (typeof console !== 'undefined') {
      console.warn('[api] VITE_API_URL not set; defaulting to http://localhost:8000')
    }
    return 'http://localhost:8000'
  }

  // 3) Non-browser (SSR/build) default
  return 'http://localhost:8000'
}

export const API_BASE: string = resolveApiBase()

export function api(path: string): string {
  if (!path.startsWith('/')) return `${API_BASE}/${path}`
  return `${API_BASE}${path}`
}
