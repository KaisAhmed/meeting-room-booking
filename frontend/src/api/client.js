export const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000'

export async function apiFetch(path, options = {}) {
  const url = `${API_BASE}${path}`
  let res
  try {
    res = await fetch(url, {
      ...options,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
    })
  } catch (e) {
    const err = new Error(`Network error calling ${url}: ${e.message || e}`)
    err.cause = e
    throw err
  }

  const isJson = (res.headers.get('content-type') || '').includes('application/json')
  const payload = isJson ? await res.json().catch(() => ({})) : {}

  if (!res.ok) {
    const message = payload.message || `Request failed: ${res.status}`
    console.error('API error', { url, status: res.status, payload })
    const err = new Error(message)
    err.status = res.status
    throw err
  }

  return payload
}

