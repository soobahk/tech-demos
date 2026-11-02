import type { IncomingMessage, ServerResponse } from "node:http"
import { HindsightClient, HindsightError } from "@vectorize-io/hindsight-client"
import type { Plugin } from "vite"

const BANK_ID = "memory-lab"
const MISSION =
  "You are a personal memory assistant for one person. Answer from memories they have shared with you. Be specific, name the facts you are using, and keep a warm tone."

interface MemoryItem {
  id: string
  type: "fact" | "experience" | "opinion" | "entity" | "observation"
  text: string
}

interface RecallHit {
  memory: MemoryItem
  score: number | null
}

function mapType(raw: string | null | undefined): MemoryItem["type"] {
  if (raw === "experience") return "experience"
  if (raw === "observation") return "observation"
  if (raw === "opinion") return "opinion"
  if (raw === "entity") return "entity"
  return "fact"
}

function entityItems(names: string[]): MemoryItem[] {
  const seen = new Set<string>()
  const items: MemoryItem[] = []
  for (const name of names) {
    const text = name.trim()
    if (!text) continue
    const id = `entity:${text.toLowerCase()}`
    if (seen.has(id)) continue
    seen.add(id)
    items.push({ id, type: "entity", text })
  }
  return items
}

function send(res: ServerResponse, status: number, body: unknown) {
  res.statusCode = status
  res.setHeader("content-type", "application/json")
  res.end(JSON.stringify(body))
}

function readJson(req: IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const chunks: Uint8Array[] = []
    req.on("data", (chunk: Uint8Array) => {
      chunks.push(chunk)
    })
    req.on("end", () => {
      const raw = Buffer.concat(chunks).toString("utf8")
      if (!raw) {
        resolve({})
        return
      }
      try {
        resolve(JSON.parse(raw) as unknown)
      } catch {
        reject(new Error("The request body was not valid JSON."))
      }
    })
    req.on("error", reject)
  })
}

function asRecord(value: unknown): Record<string, unknown> {
  if (typeof value === "object" && value !== null) {
    return value as Record<string, unknown>
  }
  return {}
}

function stringField(value: unknown, field: string): string {
  const record = asRecord(value)
  const found = record[field]
  if (typeof found !== "string" || found.trim().length === 0) {
    throw new Error(`Missing ${field}.`)
  }
  return found
}

function isUnreachable(error: unknown): boolean {
  if (!(error instanceof Error)) return false
  const message = error.message.toLowerCase()
  return (
    message.includes("fetch failed") ||
    message.includes("econnrefused") ||
    message.includes("enotfound") ||
    message.includes("network")
  )
}

function friendlyError(error: unknown, baseUrl: string): string {
  if (isUnreachable(error)) {
    return `Can't reach Hindsight at ${baseUrl}. Start the Docker server from the README, or switch back to offline mode.`
  }
  if (error instanceof Error) return error.message
  return `Can't reach Hindsight at ${baseUrl}. Start the Docker server from the README, or switch back to offline mode.`
}

function statusFor(error: unknown): number {
  if (isUnreachable(error)) return 503
  if (error instanceof HindsightError && error.statusCode) return error.statusCode
  if (error instanceof Error && error.message.startsWith("Missing")) return 400
  return 500
}

export function hindsightApi(options: { baseUrl: string }): Plugin {
  const baseUrl = options.baseUrl.replace(/\/$/, "")
  const client = new HindsightClient({ baseUrl })
  let preparing: Promise<void> | null = null

  const prepareBank = () => {
    if (!preparing) {
      preparing = (async () => {
        await client.createBank(BANK_ID, {
          name: "Memory Lab",
          reflectMission: MISSION,
        })
        try {
          await client.updateBankConfig(BANK_ID, {
            reflectMission: MISSION,
            dispositionSkepticism: 2,
            dispositionLiteralism: 3,
            dispositionEmpathy: 4,
          })
        } catch (error) {
          if (!(error instanceof HindsightError)) throw error
        }
      })().catch((error: unknown) => {
        preparing = null
        throw error
      })
    }
    return preparing
  }

  const listItems = async (): Promise<MemoryItem[]> => {
    await prepareBank()
    const collected: MemoryItem[] = []
    const names: string[] = []
    const limit = 100
    let offset = 0
    for (let page = 0; page < 5; page += 1) {
      const response = await client.listMemories(BANK_ID, { limit, offset })
      for (const item of response.items) {
        if (!item.text || item.state === "invalidated") continue
        collected.push({
          id: item.id,
          type: mapType(item.fact_type),
          text: item.text,
        })
        if (item.entities) names.push(...item.entities.split(","))
      }
      offset += response.items.length
      if (response.items.length < limit || offset >= response.total) break
    }
    return [...collected, ...entityItems(names)]
  }

  return {
    name: "hindsight-memory-api",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        void handle(req, res, next)
      })
    },
  }

  async function handle(
    req: IncomingMessage,
    res: ServerResponse,
    next: (error?: unknown) => void,
  ) {
    const url = req.url?.split("?")[0] ?? ""
    if (!url.startsWith("/api/memory")) {
      next()
      return
    }

    try {
      if (req.method === "GET" && url === "/api/memory/health") {
        const version = await client.getVersion()
        await prepareBank()
        send(res, 200, {
          ok: true,
          baseUrl,
          apiVersion: version.api_version,
        })
        return
      }

      if (req.method === "GET" && url === "/api/memory/list") {
        send(res, 200, { items: await listItems() })
        return
      }

      if (req.method === "POST" && url === "/api/memory/retain") {
        const body = await readJson(req)
        const content = stringField(body, "content")
        const context = asRecord(body).context
        await prepareBank()
        const retained = await client.retain(BANK_ID, content, {
          async: false,
          context: typeof context === "string" ? context : undefined,
        })
        send(res, 200, { ok: true, itemsCount: retained.items_count })
        return
      }

      if (req.method === "POST" && url === "/api/memory/recall") {
        const body = await readJson(req)
        const query = stringField(body, "query")
        await prepareBank()
        const recalled = await client.recall(BANK_ID, query, {
          budget: "mid",
          maxTokens: 2048,
        })
        const hits: RecallHit[] = recalled.results.map((result) => ({
          memory: {
            id: result.id,
            type: mapType(result.type),
            text: result.text,
          },
          score: result.scores?.final ?? null,
        }))
        send(res, 200, { hits })
        return
      }

      if (req.method === "POST" && url === "/api/memory/reflect") {
        const body = await readJson(req)
        const query = stringField(body, "query")
        await prepareBank()
        const answer = await client.reflect(BANK_ID, query, { budget: "low" })
        send(res, 200, { text: answer.text })
        return
      }

      send(res, 404, { error: "Unknown memory route." })
    } catch (error) {
      console.error("[hindsight]", error)
      send(res, statusFor(error), { error: friendlyError(error, baseUrl) })
    }
  }
}
