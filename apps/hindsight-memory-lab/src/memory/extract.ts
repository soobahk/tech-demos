import type { MemoryType } from "./types.ts"

export interface ExtractedMemory {
  type: Exclude<MemoryType, "observation">
  text: string
}

const EXPERIENCE =
  /\b(yesterday|last night|last week|last month|earlier today|this morning)\b|\b(?:i|we)\s+(?:finished|made|built|visited|started|went)\b/i

const OPINION =
  /\b(?:i|we)\s+(?:prefer|hate|love|like|dislike|enjoy|think|believe|can't stand|cannot stand)\b/i

export function isQuestion(content: string): boolean {
  const text = content.trim()
  return (
    /\?\s*$/.test(text) ||
    /^(what|who|where|when|why|how|can you|could you|do you|remind me|tell me)\b/i.test(text)
  )
}

function clauses(content: string): string[] {
  return content
    .split(/[.!?]+/g)
    .flatMap((sentence) => sentence.split(/,\s+and\s+/i))
    .map((part) => part.trim())
    .filter((part) => part.length > 0)
}

function punctuate(text: string): string {
  return `${text.trim().replace(/[.!?]+$/, "")}.`
}

export function extractMemories(content: string): ExtractedMemory[] {
  if (isQuestion(content)) return []

  const found: ExtractedMemory[] = []
  const seen = new Set<string>()

  const add = (type: ExtractedMemory["type"], text: string) => {
    const cleaned = text.replace(/\s+/g, " ").trim()
    if (!cleaned) return
    const key = `${type}:${cleaned.toLowerCase()}`
    if (seen.has(key)) return
    seen.add(key)
    found.push({ type, text: cleaned })
  }

  for (const clause of clauses(content)) {
    const name = clause.match(/\b(?:i['’]m|i am|my name is)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i)
    if (name?.[1]) {
      add("fact", `Name is ${name[1]}.`)
      add("entity", name[1])
    }

    const home = clause.match(/\blive in\s+([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)*)/)
    if (home?.[1]) {
      add("fact", `Lives in ${home[1]}.`)
      add("entity", home[1])
    }

    const role = clause.match(/\bworks? as (?:(an?) )?([a-z][\w-]*)/i)
    if (role?.[2]) {
      const article = role[1]?.toLowerCase() ?? "a"
      add("fact", `Works as ${article} ${role[2]}.`)
      add("entity", role[2])
    }

    if (EXPERIENCE.test(clause)) add("experience", punctuate(clause))
    if (OPINION.test(clause)) add("opinion", punctuate(clause))

    const market = clause.match(/\bfor the ([A-Z][a-z]+(?:\s+[a-z]+){0,3})/)
    if (market?.[1]) add("entity", market[1])
  }

  if (found.length === 0) add("fact", punctuate(content.trim()))
  return found
}
