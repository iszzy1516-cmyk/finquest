const API_BASE = "/api/v1"

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE}${endpoint}`
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((options.headers as Record<string, string>) || {}),
  }

  const token = localStorage.getItem("access_token")
  if (token) {
    headers["Authorization"] = `Bearer ${token}`
  }

  const res = await fetch(url, {
    ...options,
    headers,
    credentials: "include",
  })

  if (!res.ok) {
    let errorData: any = {}
    try {
      errorData = await res.json()
    } catch {
      // ignore
    }
    const message = errorData?.error?.message || errorData?.detail || `HTTP ${res.status}`
    throw new Error(message)
  }

  const text = await res.text()
  if (!text) return {} as T
  return JSON.parse(text) as T
}

export const api = {
  get: <T>(endpoint: string) => request<T>(endpoint, { method: "GET" }),
  post: <T>(endpoint: string, body?: unknown) =>
    request<T>(endpoint, { method: "POST", body: body ? JSON.stringify(body) : undefined }),
  put: <T>(endpoint: string, body?: unknown) =>
    request<T>(endpoint, { method: "PUT", body: body ? JSON.stringify(body) : undefined }),
  patch: <T>(endpoint: string, body?: unknown) =>
    request<T>(endpoint, { method: "PATCH", body: body ? JSON.stringify(body) : undefined }),
  del: <T>(endpoint: string) => request<T>(endpoint, { method: "DELETE" }),
}

export type ApiResponse<T> = {
  success: boolean
  data: T
  meta?: {
    timestamp: string
    request_id: string
    pagination?: {
      page: number
      limit: number
      total: number
      pages: number
    }
  }
}

export type PaginatedResponse<T> = {
  items: T[]
  total: number
  page: number
  pages: number
}
