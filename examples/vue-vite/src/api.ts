const BASE_URL = 'https://jsonplaceholder.typicode.com'

export async function fetchUsers() {
  const res = await fetch(`${BASE_URL}/users`)
  if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to fetch users`)
  return res.json()
}

export async function fetchPosts() {
  const res = await fetch(`${BASE_URL}/posts`)
  if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to fetch posts`)
  return res.json()
}

export async function triggerApiError() {
  // This endpoint doesn't exist - will return 404
  const res = await fetch(`${BASE_URL}/nonexistent-endpoint-12345`)
  if (!res.ok) {
    throw new Error(`API Error: ${res.status} ${res.statusText}`)
  }
  return res.json()
}

export async function createPost(title: string, body: string) {
  const res = await fetch(`${BASE_URL}/posts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ title, body, userId: 1 })
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to create post`)
  return res.json()
}
