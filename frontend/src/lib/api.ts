// Simple debug switch: enable by setting localStorage.AO_DEBUG = '1'
const DEBUG = (() => {
  try {
    return (typeof localStorage !== 'undefined' && localStorage.getItem('AO_DEBUG') === '1')
      || (import.meta as any)?.env?.MODE !== 'production'
  } catch { return false }
})()

function dbg(...args: any[]) {
  if (!DEBUG) return
  try {
    // group logs once per import
    if (!(dbg as any)._grouped) {
      console.groupCollapsed('[api-debug] configuration')
      ;(dbg as any)._grouped = true
    }
    console.log('[api-debug]', ...args)
  } catch {}
}

function isBrowser(): boolean { return typeof window !== 'undefined' && typeof document !== 'undefined' }

function isAbsoluteHttpUrl(u: string | undefined): u is string {
  if (!u) return false
  try {
    const url = new URL(u)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch { return false }
}

function resolveApiBase(): string {
  // IMPORTANT: use direct `import.meta.env.*` access so Vite can statically
  // replace the values at build time. Indirect access (e.g. `(import.meta as any)?.env`)
  // prevents replacement and yields `undefined` in production bundles.
  // Use direct references so Vite replaces them at build time
  const envUrl = (import.meta as any).env.VITE_API_URL as string | undefined
  const mode = (import.meta as any).env.MODE as string | undefined
  const dev = (import.meta as any).env.DEV as boolean | undefined

  dbg('env.VITE_API_URL =', envUrl)
  dbg('env.MODE =', mode, 'env.DEV =', dev)

  if (envUrl) {
    // Require absolute URL with protocol
    if (!isAbsoluteHttpUrl(envUrl)) {
      console.error('[api] Invalid VITE_API_URL:', envUrl, '\nPlease set a full URL with protocol, e.g. https://your-backend.domain')
      if (isBrowser()) console.info('Tip: In Zeabur, set this on the frontend (static) service and rebuild the frontend.')
      // Do not guess in production
      if (isBrowser() && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
        throw new Error('VITE_API_URL must be an absolute URL with protocol in production.')
      }
      // Local fallback for dev only
      return 'http://localhost:8000'
    }
    // Avoid mixed content on https pages
    if (isBrowser() && window.location.protocol === 'https:' && envUrl.startsWith('http://')) {
      console.error('[api] VITE_API_URL uses http on an https page. Browsers will block mixed content. Use https backend URL instead:', envUrl)
      throw new Error('Mixed content blocked: set VITE_API_URL to an https URL')
    }
    return envUrl
  }

  // No env provided
  if (isBrowser()) {
    const host = window.location.hostname
    dbg('window.location =', window.location.href)
    // Local dev heuristic
    if (host === 'localhost' || host === '127.0.0.1') {
    // Production: be strict and stop early with clear guidance
    console.error('[api] VITE_API_URL is not set in production. Configure it on the frontend service and rebuild. Example: https://your-backend.domain')
    throw new Error('VITE_API_URL missing in production')
    }
    // Otherwise, use the same protocol as the current page
    console.warn('[api] VITE_API_URL not set; defaulting to current origin')
    return window.location.origin
  }

  // Non-browser default (SSR/build); keep a sane dev default
  return 'http://localhost:8000'
}

export const API_BASE: string = resolveApiBase()

export function api(path: string): string {
  if (!path.startsWith('/')) return `${API_BASE}/${path}`
  return `${API_BASE}${path}`
}
