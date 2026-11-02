import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "cn"
import type { MemoryItem, MemoryType, RecallHit } from "@/memory/types"

const GROUPS: { type: MemoryType; label: string }[] = [
  { type: "fact", label: "Facts" },
  { type: "experience", label: "Experiences" },
  { type: "opinion", label: "Opinions" },
  { type: "entity", label: "Entities" },
  { type: "observation", label: "Observations" },
]

interface MemoryPanelProps {
  memories: MemoryItem[]
  newIds: ReadonlySet<string>
  recalled: RecallHit[] | null
  live: boolean
}

export function MemoryPanel({ memories, newIds, recalled, live }: MemoryPanelProps) {
  return (
    <section className="flex h-full min-h-0 flex-col overflow-hidden border-t bg-background lg:border-t-0 lg:border-l">
      <div className="flex items-baseline justify-between gap-3 px-4 py-3">
        <div>
          <h2 className="text-sm font-medium">Memory bank</h2>
          <p className="text-xs text-muted-foreground">This bank carries into the next session.</p>
        </div>
        <Badge variant="secondary">{memories.length}</Badge>
      </div>
      <ScrollArea className="min-h-0 flex-1">
        <div className="flex flex-col gap-4 px-4 pb-4">
          <Card size="sm">
            <CardHeader>
              <CardTitle>Recalled for this reply</CardTitle>
              <CardDescription>
                {recalled === null
                  ? "Send a message to see which memories the reply used."
                  : recalled.length === 0
                    ? "No stored memories matched this message."
                    : `${recalled.length} pulled in for the latest answer.`}
              </CardDescription>
            </CardHeader>
            {recalled && recalled.length > 0 ? (
              <CardContent className="flex flex-col gap-2">
                {recalled.map((hit) => (
                  <MemoryRow
                    key={hit.memory.id}
                    item={hit.memory}
                    isNew={false}
                    score={hit.score}
                  />
                ))}
              </CardContent>
            ) : null}
          </Card>

          {GROUPS.map((group) => {
            const items = memories.filter((item) => item.type === group.type)
            if (group.type === "observation" && items.length === 0) return null
            return (
              <section key={group.type} className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                    {group.label}
                  </h3>
                  <span className="text-xs text-muted-foreground">{items.length}</span>
                </div>
                {items.length === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    {group.type === "opinion" && live
                      ? "The live API stores world facts, experiences, and observations. Opinions are extracted in offline mode."
                      : "None yet."}
                  </p>
                ) : (
                  items.map((item) => (
                    <MemoryRow key={item.id} item={item} isNew={newIds.has(item.id)} />
                  ))
                )}
              </section>
            )
          })}
        </div>
      </ScrollArea>
    </section>
  )
}

function MemoryRow({
  item,
  isNew,
  score,
}: {
  item: MemoryItem
  isNew: boolean
  score?: number | null
}) {
  return (
    <div
      className={cn(
        "rounded-lg border px-2.5 py-2",
        isNew ? "border-primary bg-primary/5" : "border-border",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm leading-snug">{item.text}</p>
        {isNew ? <Badge>New</Badge> : null}
        {score != null ? <Badge variant="outline">{score.toFixed(2)}</Badge> : null}
      </div>
    </div>
  )
}
