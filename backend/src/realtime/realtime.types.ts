export interface RealtimeEvent<T = unknown> {
  channel: string;
  data: T;
  timestamp: string;
}
