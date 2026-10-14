/**
 * Pure decision logic for `updater.ts`, deliberately electron-import-free —
 * same reasoning as `dialogs-logic.ts`/`app-menu-logic.ts`. Defines its own
 * minimal payload shapes rather than importing `electron-updater`'s
 * `UpdateInfo`/`ProgressInfo` types, so this file has zero runtime or
 * type-level coupling to that package at all.
 */

export interface UpdateAvailableInfo {
  version: string
  releaseNotes?: string | null
}

export interface UpdateProgressInfo {
  percent: number
  transferred: number
  total: number
}

/**
 * Tracks whether `update-available` has actually fired — `downloadUpdate()`
 * must not call the real `autoUpdater.downloadUpdate()` before that, or
 * `electron-updater` throws "Please check update first" (the original
 * source's own ISS-004 note). A tiny state machine, not a bare module-level
 * `let`, so it's a unit-testable, resettable object instead of global
 * mutable state — `updater.ts` owns exactly one instance per process,
 * matching the original's single-updater assumption.
 */
export class UpdaterReadyState {
  #ready = false

  reset(): void {
    this.#ready = false
  }

  markReady(): void {
    this.#ready = true
  }

  get isReady(): boolean {
    return this.#ready
  }
}

// Failures that mean the update server could not be reached or had no feed to give: the user's
// network, a proxy, a server-side outage. Logged as warnings — an app that logs errors as defects
// would otherwise count every offline launch as one.
const NETWORK_CODES = new Set(['ENOTFOUND', 'ECONNRESET', 'ECONNREFUSED', 'ECONNABORTED', 'ETIMEDOUT', 'EAI_AGAIN', 'ENETUNREACH', 'EHOSTUNREACH'])

/** Whether an updater error is the network or the server rather than the app. */
export function isUnreachableUpdateError(error: { message?: string; code?: unknown }): boolean {
  if (typeof error.code === 'string' && NETWORK_CODES.has(error.code)) return true
  const message = error.message ?? ''
  if (/net::ERR_[A-Z_]+/.test(message)) return true
  if ([...NETWORK_CODES].some((code) => message.includes(code))) return true
  // electron-updater's HttpError: a missing feed (404) or a failing server (5xx).
  return /HttpError: (404|5\d\d)\b/.test(message)
}
