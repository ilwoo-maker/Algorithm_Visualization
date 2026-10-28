import { beforeEach, vi } from 'vitest'
// jsdom has no Canvas backend. Rendering tests record commands explicitly;
// application integration tests exercise graceful context unavailability.
beforeEach(() => {
  if (typeof HTMLCanvasElement !== 'undefined') vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null)
})
