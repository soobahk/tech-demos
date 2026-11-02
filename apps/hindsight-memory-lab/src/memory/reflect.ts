import { isQuestion } from "./extract.ts"
import type { RecallHit } from "./types.ts"

export function reflectFromHits(query: string, hits: RecallHit[]): string {
  if (!isQuestion(query)) {
    return "Saved. That stays in the bank when you start a new session."
  }
  if (hits.length === 0) {
    return "I don't have anything about that yet."
  }
  const sentences = hits.map((hit) => hit.memory.text.trim())
  return `From memory: ${sentences.join(" ")}`
}
