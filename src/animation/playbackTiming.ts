/** Seconds at 1×, shared by every edge scene and its reading interval. */
export const PLAYBACK_TIMING = { decision: 0.3, settle: 0.7, commit: 1.1, reading: 0.7, bloom: 0.6, announcement: 0.35, restoreSnap: 0.15 } as const
export type TransitionPhase = 'idle' | 'entrance' | 'focus' | 'decision' | 'settle' | 'completion' | 'announcement' | 'reading'
export type PlaybackStatus = 'idle' | 'playing' | 'paused' | 'finished'
export type PlaybackSpeed = 0.5 | 1 | 2
