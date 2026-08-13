export type EventType =
  | 'product_viewed'
  | 'product_searched'
  | 'filter_applied'
  | 'product_clicked'
  | 'product_favorited'
  | 'cart_added'
  | 'cart_removed'
  | 'checkout_started'
  | 'purchased'
  | 'product_reviewed'
  | 'recommendation_shown'
  | 'ai_query_submitted'

export interface TrackEvent {
  type: EventType
  payload: Record<string, unknown>
  occurredAt: string
  sessionId: string
  anonymousId: string
}
