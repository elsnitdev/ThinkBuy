import type { EventType, TrackEvent } from './events'

const ANONYMOUS_ID_KEY = 'tb_anonymous_id'
const SESSION_ID_KEY = 'tb_session_id'
const FLUSH_INTERVAL_MS = 5000
const BATCH_SIZE = 10

function getAnonymousId(): string {
  let id = localStorage.getItem(ANONYMOUS_ID_KEY)
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem(ANONYMOUS_ID_KEY, id)
  }
  return id
}

function getSessionId(): string {
  let id = sessionStorage.getItem(SESSION_ID_KEY)
  if (!id) {
    id = crypto.randomUUID()
    sessionStorage.setItem(SESSION_ID_KEY, id)
  }
  return id
}

const queue: TrackEvent[] = []

export function track(type: EventType, payload: Record<string, unknown>) {
  queue.push({
    type,
    payload,
    occurredAt: new Date().toISOString(),
    sessionId: getSessionId(),
    anonymousId: getAnonymousId(),
  })
  if (queue.length >= BATCH_SIZE) flush()
}

function flush() {
  if (!queue.length) return
  const batch = queue.splice(0)
  navigator.sendBeacon('/api/v1/tracking/events', JSON.stringify(batch))
}

setInterval(flush, FLUSH_INTERVAL_MS)
window.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') flush()
})
