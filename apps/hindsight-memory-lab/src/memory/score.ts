const STOP = new Set([
  "a",
  "an",
  "the",
  "i",
  "me",
  "my",
  "you",
  "your",
  "do",
  "does",
  "did",
  "what",
  "who",
  "when",
  "why",
  "how",
  "about",
  "to",
  "of",
  "in",
  "on",
  "for",
  "and",
  "or",
  "is",
  "are",
  "was",
  "were",
  "be",
  "it",
  "that",
  "this",
  "with",
  "from",
  "remember",
  "can",
  "please",
  "tell",
  "have",
  "has",
  "just",
  "into",
  "not",
])

const SYNONYMS: Record<string, string[]> = {
  like: ["prefer", "love", "hate", "enjoy", "dislike"],
  prefer: ["like"],
  hate: ["like", "dislike"],
  live: ["lives", "living"],
  lives: ["live", "living"],
  where: ["live", "lives"],
  work: ["works", "working", "job"],
  works: ["work", "job"],
  make: ["made", "finished", "built"],
  made: ["make", "finished"],
  finished: ["make", "made"],
  recently: ["yesterday", "earlier"],
  yesterday: ["recently"],
}

function tokens(text: string): string[] {
  return (text.toLowerCase().match(/[a-z0-9']+/g) ?? []).filter(
    (token) => token.length > 2 && !STOP.has(token),
  )
}

function matches(token: string, haystack: Set<string>): boolean {
  if (haystack.has(token)) return true
  return (SYNONYMS[token] ?? []).some((synonym) => haystack.has(synonym))
}

export function scoreMemory(query: string, memoryText: string): number {
  const queryTokens = tokens(query)
  if (queryTokens.length === 0) return 0
  const haystack = new Set(tokens(memoryText))
  let hits = 0
  for (const token of queryTokens) {
    if (matches(token, haystack)) hits += 1
  }
  return hits / queryTokens.length
}
