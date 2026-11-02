export type MemoryType = "fact" | "experience" | "opinion" | "entity" | "observation"

export interface MemoryItem {
  id: string
  type: MemoryType
  text: string
}

export interface RecallHit {
  memory: MemoryItem
  score: number | null
}

export interface MemoryBackend {
  retain(content: string, context?: string): Promise<MemoryItem[]>
  recall(query: string): Promise<RecallHit[]>
  list(): Promise<MemoryItem[]>
  reflect(query: string): Promise<string>
}
