import type { MemoryBackend, MemoryItem, RecallHit } from "./types.ts"

interface HealthResponse {
  ok: true
  baseUrl: string
  apiVersion: string
}

async function request<T>(path: string, init?: { method?: string; body?: unknown }): Promise<T> {
  let response: Response
  try {
    response = await fetch(path, {
      method: init?.method ?? "GET",
      headers: init?.body ? { "content-type": "application/json" } : undefined,
      body: init?.body ? JSON.stringify(init.body) : undefined,
    })
  } catch {
    throw new Error("The app server did not answer. Restart bun run dev and try again.")
  }

  const data: unknown = await response.json().catch(() => ({}))
  if (!response.ok) {
    const message =
      typeof data === "object" && data !== null && "error" in data && typeof data.error === "string"
        ? data.error
        : `Request failed (${response.status}).`
    throw new Error(message)
  }
  return data as T
}

export class LiveMemoryBackend implements MemoryBackend {
  health(): Promise<HealthResponse> {
    return request<HealthResponse>("/api/memory/health")
  }

  async retain(content: string, context?: string): Promise<MemoryItem[]> {
    const before = new Set((await this.list()).map((item) => item.id))
    await request("/api/memory/retain", {
      method: "POST",
      body: { content, context },
    })
    const after = await this.list()
    return after.filter((item) => !before.has(item.id))
  }

  async recall(query: string): Promise<RecallHit[]> {
    const data = await request<{ hits: RecallHit[] }>("/api/memory/recall", {
      method: "POST",
      body: { query },
    })
    return data.hits
  }

  async list(): Promise<MemoryItem[]> {
    const data = await request<{ items: MemoryItem[] }>("/api/memory/list")
    return data.items
  }

  async reflect(query: string): Promise<string> {
    const data = await request<{ text: string }>("/api/memory/reflect", {
      method: "POST",
      body: { query },
    })
    return data.text
  }
}
