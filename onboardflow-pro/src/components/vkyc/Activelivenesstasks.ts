export interface ActiveTask {
  id: "head_left" | "head_right" | "nod" | "smile" | "raise_eyebrows"
  instruction: string
  durationMs: number
  hint: string
}

export const ACTIVE_TASKS: ActiveTask[] = [
  {
    id: "head_left",
    instruction: "Slowly turn your head to the LEFT",
    durationMs: 4000,
    hint: "Turn and hold for a moment"
  },
  {
    id: "head_right",
    instruction: "Slowly turn your head to the RIGHT",
    durationMs: 4000,
    hint: "Turn and hold for a moment"
  },
  {
    id: "nod",
    instruction: "Nod your head up and down",
    durationMs: 4000,
    hint: "One full nod is enough"
  },
  {
    id: "smile",
    instruction: "Give a natural smile",
    durationMs: 3500,
    hint: "Hold the smile for a moment"
  },
  {
    id: "raise_eyebrows",
    instruction: "Raise your eyebrows",
    durationMs: 3500,
    hint: "Hold for a moment then relax"
  }
]

// Fisher-Yates shuffle, pick first n
export function pickRandomTasks(n: number): ActiveTask[] {
  const pool = [...ACTIVE_TASKS]
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[pool[i], pool[j]] = [pool[j], pool[i]]
  }
  return pool.slice(0, n)
}