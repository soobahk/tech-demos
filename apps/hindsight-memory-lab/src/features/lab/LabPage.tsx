import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { DEMO_SCRIPT } from "@/memory/demo-script"
import { LiveMemoryBackend } from "@/memory/live-backend"
import { MockMemoryBackend } from "@/memory/mock-backend"
import type { MemoryBackend, MemoryItem, RecallHit } from "@/memory/types"
import { useRef, useState } from "react"
import { ChatPane, type ChatMessage } from "./ChatPane"
import { MemoryPanel } from "./MemoryPanel"

type Mode = "offline" | "live"

type Connection =
  | { state: "offline" }
  | { state: "checking" }
  | { state: "connected"; baseUrl: string; apiVersion: string }
  | { state: "unreachable"; message: string }

function delay(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

export function LabPage() {
  const mockRef = useRef(new MockMemoryBackend())
  const liveRef = useRef(new LiveMemoryBackend())
  const checkRef = useRef(0)

  const [mode, setMode] = useState<Mode>("offline")
  const [connection, setConnection] = useState<Connection>({ state: "offline" })
  const [session, setSession] = useState(1)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [memories, setMemories] = useState<MemoryItem[]>([])
  const [newIds, setNewIds] = useState<ReadonlySet<string>>(new Set())
  const [recalled, setRecalled] = useState<RecallHit[] | null>(null)
  const [draft, setDraft] = useState("")
  const [busy, setBusy] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const backendFor = (next: Mode): MemoryBackend =>
    next === "live" ? liveRef.current : mockRef.current

  async function refresh(backend: MemoryBackend) {
    setMemories(await backend.list())
    setNewIds(new Set())
    setRecalled(null)
  }

  async function applyMode(next: Mode) {
    setMode(next)
    setError(null)
    setRecalled(null)
    setNewIds(new Set())
    if (next === "offline") {
      checkRef.current += 1
      setConnection({ state: "offline" })
      await refresh(mockRef.current)
      return
    }

    setMemories([])
    const id = ++checkRef.current
    setConnection({ state: "checking" })
    try {
      const health = await liveRef.current.health()
      if (id !== checkRef.current) return
      setConnection({
        state: "connected",
        baseUrl: health.baseUrl,
        apiVersion: health.apiVersion,
      })
      setMemories(await liveRef.current.list())
      setNewIds(new Set())
      setRecalled(null)
    } catch (caught) {
      if (id !== checkRef.current) return
      const message = caught instanceof Error ? caught.message : "Hindsight is unreachable."
      setConnection({ state: "unreachable", message })
      setError(message)
      setMemories([])
    }
  }

  async function deliver(
    backend: MemoryBackend,
    text: string,
    sessionNumber: number,
    pause: boolean,
  ) {
    setMessages((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        role: "user",
        text,
        session: sessionNumber,
      },
    ])
    if (pause) await delay(450)
    setBusy(true)
    setError(null)
    try {
      const retained = await backend.retain(text, `Session ${sessionNumber}`)
      setMemories(await backend.list())
      setNewIds(new Set(retained.map((item) => item.id)))
      setRecalled(await backend.recall(text))
      const answer = await backend.reflect(text)
      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          text: answer,
          session: sessionNumber,
        },
      ])
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "The agent could not answer."
      setError(message)
      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          text: message,
          session: sessionNumber,
        },
      ])
    } finally {
      setBusy(false)
    }
  }

  async function send() {
    const text = draft.trim()
    if (!text || busy || playing) return
    setDraft("")
    await deliver(backendFor(mode), text, session, false)
  }

  function newSession() {
    if (busy || playing) return
    setSession((current) => current + 1)
    setMessages([])
    setRecalled(null)
    setNewIds(new Set())
    setError(null)
  }

  async function play() {
    if (playing || busy) return
    setPlaying(true)
    setMode("offline")
    checkRef.current += 1
    setConnection({ state: "offline" })
    setError(null)
    mockRef.current.reset()
    setMemories([])
    setNewIds(new Set())
    setRecalled(null)
    setMessages([])
    setDraft("")
    let sessionNumber = 1
    setSession(sessionNumber)
    try {
      for (const step of DEMO_SCRIPT) {
        if (step.kind === "new-session") {
          sessionNumber += 1
          setSession(sessionNumber)
          setMessages([])
          setRecalled(null)
          setNewIds(new Set())
          await delay(900)
          continue
        }
        await deliver(mockRef.current, step.text, sessionNumber, true)
        await delay(1100)
      }
    } finally {
      setPlaying(false)
    }
  }

  const statusLabel =
    connection.state === "connected"
      ? `Connected · ${connection.apiVersion}`
      : connection.state === "checking"
        ? "Checking server"
        : connection.state === "unreachable"
          ? "Server unreachable"
          : "Mock bank"

  return (
    <div className="flex h-svh flex-col bg-muted/40 text-foreground">
      <header className="border-b bg-background">
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-base font-medium">Hindsight Memory Lab</h1>
              <Badge variant="outline">Session {session}</Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              One person, several sessions. Watch retain and recall fill the bank.{" "}
              <a
                className="underline underline-offset-2"
                href="https://x.com/HermesWatcher/status/2114492238659305561"
              >
                Source post
              </a>
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" variant="outline" disabled={busy || playing} onClick={newSession}>
              New session
            </Button>
            <Button
              type="button"
              variant="secondary"
              disabled={busy || playing}
              onClick={() => {
                void play()
              }}
            >
              {playing ? "Playing demo" : "Play demo script"}
            </Button>
            <div className="flex items-center gap-2 pl-1">
              <span
                className={
                  mode === "offline" ? "text-sm font-medium" : "text-sm text-muted-foreground"
                }
              >
                Offline
              </span>
              <Switch
                id="live-mode"
                checked={mode === "live"}
                disabled={playing}
                aria-label="Use the live Hindsight server"
                onCheckedChange={(checked) => {
                  void applyMode(checked ? "live" : "offline")
                }}
              />
              <span
                className={
                  mode === "live" ? "text-sm font-medium" : "text-sm text-muted-foreground"
                }
              >
                Live
              </span>
              <Badge variant={connection.state === "unreachable" ? "destructive" : "secondary"}>
                {statusLabel}
              </Badge>
            </div>
          </div>
        </div>
      </header>
      {error ? (
        <div className="border-b bg-destructive/10 px-4 py-2 text-sm text-destructive">{error}</div>
      ) : null}
      <main className="grid min-h-0 flex-1 grid-rows-[minmax(0,1fr)] lg:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.9fr)]">
        <ChatPane
          messages={messages}
          draft={draft}
          busy={busy}
          playing={playing}
          onDraft={setDraft}
          onSend={() => {
            void send()
          }}
        />
        <MemoryPanel
          memories={memories}
          newIds={newIds}
          recalled={recalled}
          live={mode === "live"}
        />
      </main>
    </div>
  )
}
