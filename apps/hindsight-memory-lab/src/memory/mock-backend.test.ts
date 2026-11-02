import { describe, expect, test } from "bun:test"
import { extractMemories } from "./extract.ts"
import { MockMemoryBackend } from "./mock-backend.ts"

const INTRO = "Hi, I'm Maya Chen. I live in Lisbon and I work as a ceramicist."
const PREFERENCES = "I prefer morning work sessions, and I hate last-minute client calls."
const MARKET = "Yesterday I finished a set of bowls for the Saturday market."

describe("extractMemories", () => {
  test("pulls name, home, role, and entities from an introduction", () => {
    const texts = extractMemories(INTRO).map((item) => `${item.type}:${item.text}`)
    expect(texts).toEqual([
      "fact:Name is Maya Chen.",
      "entity:Maya Chen",
      "fact:Lives in Lisbon.",
      "entity:Lisbon",
      "fact:Works as a ceramicist.",
      "entity:ceramicist",
    ])
  })

  test("splits preference clauses into opinions", () => {
    const opinions = extractMemories(PREFERENCES).filter((item) => item.type === "opinion")
    expect(opinions.map((item) => item.text)).toEqual([
      "I prefer morning work sessions.",
      "I hate last-minute client calls.",
    ])
  })

  test("stores a past event and the market as an entity", () => {
    const extracted = extractMemories(MARKET)
    expect(extracted).toEqual([
      {
        type: "experience",
        text: "Yesterday I finished a set of bowls for the Saturday market.",
      },
      { type: "entity", text: "Saturday market" },
    ])
  })

  test("does not retain a question as a memory", () => {
    expect(extractMemories("What do you remember about how I like to work?")).toEqual([])
  })
})

describe("MockMemoryBackend", () => {
  test("dedupes repeated retains and reset clears the bank", async () => {
    const backend = new MockMemoryBackend()
    const first = await backend.retain(INTRO)
    const second = await backend.retain(INTRO)
    expect(first.length).toBeGreaterThan(0)
    expect(second).toEqual([])
    expect((await backend.list()).length).toBe(first.length)
    backend.reset()
    expect(await backend.list()).toEqual([])
  })

  test("recalls work preferences across earlier retains", async () => {
    const backend = new MockMemoryBackend()
    await backend.retain(INTRO)
    await backend.retain(PREFERENCES)
    await backend.retain(MARKET)

    const hits = await backend.recall("What do you remember about how I like to work?")
    const texts = hits.map((hit) => hit.memory.text)
    expect(texts[0]).toBe("I prefer morning work sessions.")
    expect(texts).toContain("I hate last-minute client calls.")
  })

  test("recalls the recent make and the home city", async () => {
    const backend = new MockMemoryBackend()
    await backend.retain(INTRO)
    await backend.retain(PREFERENCES)
    await backend.retain(MARKET)

    const hits = await backend.recall("What did I make recently, and where do I live?")
    const texts = hits.map((hit) => hit.memory.text).join(" ")
    expect(texts).toContain("Lisbon")
    expect(texts.toLowerCase()).toContain("bowls")
  })

  test("reflect cites recalled memories for a question", async () => {
    const backend = new MockMemoryBackend()
    await backend.retain(PREFERENCES)
    const answer = await backend.reflect("What do you remember about how I like to work?")
    expect(answer.startsWith("From memory:")).toBe(true)
    expect(answer).toContain("morning work sessions")
  })
})
