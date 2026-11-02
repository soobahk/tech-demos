export type DemoStep = { kind: "user"; text: string } | { kind: "new-session" }

export const DEMO_SCRIPT: DemoStep[] = [
  {
    kind: "user",
    text: "Hi, I'm Maya Chen. I live in Lisbon and I work as a ceramicist.",
  },
  {
    kind: "user",
    text: "I prefer morning work sessions, and I hate last-minute client calls.",
  },
  {
    kind: "user",
    text: "Yesterday I finished a set of bowls for the Saturday market.",
  },
  { kind: "new-session" },
  {
    kind: "user",
    text: "What do you remember about how I like to work?",
  },
  {
    kind: "user",
    text: "What did I make recently, and where do I live?",
  },
]
