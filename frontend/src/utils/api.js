const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3333"

export async function apiFetch(path, options = {}) {
  const url = `${API_BASE_URL}${path}`
  const res = await fetch(url, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  })
  if (!res.ok) {
    throw new Error(`API Error: ${res.status}`)
  }
  return res.json()
}

export default API_BASE_URL
