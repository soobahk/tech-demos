import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Textarea } from "@/components/ui/textarea"
import { useEffect, useRef } from "react"

export interface ChatMessage {
  id: string
  role: "user" | "assistant"
  text: string
  session: number
}

interface ChatPaneProps {
  messages: ChatMessage[]
  draft: string
  busy: boolean
  playing: boolean
  onDraft: (value: string) => void
  onSend: () => void
}

export function ChatPane({ messages, draft, busy, playing, onDraft, onSend }: ChatPaneProps) {
  const bottomRef = useRef<HTMLDivElement>(null)
  const locked = busy || playing

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" })
  }, [messages])

  return (
    <section className="flex h-full min-h-0 flex-col overflow-hidden bg-background">
      <ScrollArea className="min-h-0 flex-1">
        <div className="flex flex-col gap-3 px-4 py-4">
          {messages.length === 0 ? (
            <div className="mx-auto max-w-md py-16 text-center">
              <p className="text-sm leading-relaxed text-muted-foreground">
                Tell the agent who you are. A new session clears this transcript and leaves the bank
                on the right in place.
              </p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={
                  message.role === "user"
                    ? "ml-auto max-w-[85%] rounded-2xl bg-primary px-3 py-2 text-sm leading-relaxed text-primary-foreground"
                    : "mr-auto max-w-[85%] rounded-2xl bg-muted px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap"
                }
              >
                {message.text}
              </div>
            ))
          )}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>
      <form
        className="border-t px-4 py-3"
        onSubmit={(event) => {
          event.preventDefault()
          onSend()
        }}
      >
        <Textarea
          value={draft}
          placeholder="Share something the agent should keep"
          disabled={locked}
          aria-label="Message"
          className="min-h-16 resize-none"
          onChange={(event) => onDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault()
              onSend()
            }
          }}
        />
        <div className="mt-2 flex items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">Enter sends. Shift+Enter adds a line.</p>
          <Button type="submit" disabled={locked || draft.trim().length === 0}>
            {busy ? "Thinking" : "Send"}
          </Button>
        </div>
      </form>
    </section>
  )
}
