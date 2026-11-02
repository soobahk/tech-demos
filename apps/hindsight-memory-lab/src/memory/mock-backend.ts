import { extractMemories } from "./extract.ts"
import { reflectFromHits } from "./reflect.ts"
import { scoreMemory } from "./score.ts"
import type { MemoryBackend, MemoryItem, RecallHit } from "./types.ts"

export class MockMemoryBackend implements MemoryBackend {
  private items: MemoryItem[] = []
  private seq = 0

  async retain(content: string): Promise<MemoryItem[]> {
    const added: MemoryItem[] = []
    for (const extracted of extractMemories(content)) {
      const exists = this.items.some(
        (item) =>
          item.type === extracted.type && item.text.toLowerCase() === extracted.text.toLowerCase(),
      )
      if (exists) continue
      const memory: MemoryItem = {
        id: `mem-${++this.seq}`,
        type: extracted.type,
        text: extracted.text,
      }
      this.items.push(memory)
      added.push(memory)
    }
    return added
  }

  async recall(query: string): Promise<RecallHit[]> {
    return this.items
      .map((memory) => ({ memory, score: scoreMemory(query, memory.text) }))
      .filter((hit) => hit.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 6)
  }

  async list(): Promise<MemoryItem[]> {
    return [...this.items]
  }

  async reflect(query: string): Promise<string> {
    return reflectFromHits(query, await this.recall(query))
  }

  reset(): void {
    this.items = []
    this.seq = 0
  }
}
