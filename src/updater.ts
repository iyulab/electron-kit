import { autoUpdater } from 'electron-updater'
import { UpdaterReadyState, type UpdateAvailableInfo, type UpdateProgressInfo } from './updater-logic.js'

export { UpdaterReadyState } from './updater-logic.js'
export type { UpdateAvailableInfo, UpdateProgressInfo } from './updater-logic.js'

export interface UpdaterConfig {
  log: {
    info: (msg: string) => void
    warn: (msg: string) => void
    error: (msg: string) => void
  }
  /**
   * `electron-updater`'s own default is differential (delta) downloads.
   * Set `true` only if your release pipeline reliably publishes a
   * `.blockmap` asset alongside every release — omitting one makes
   * `electron-updater` log a fetch error on every check for that release.
   * Default: `false` (electron-updater's own default, not overridden).
   */
  disableDifferentialDownload?: boolean
  /** Called when `update-available` fires, before the download starts. */
  onAvailable?: (info: UpdateAvailableInfo) => void
  /** Called on each `download-progress` tick. */
  onProgress?: (progress: UpdateProgressInfo) => void
  /** Called when `update-downloaded` fires — the update installs on quit. */
  onDownloaded?: (info: UpdateAvailableInfo) => void
  /** Called on any updater error (check, download, or otherwise). */
  onError?: (error: Error) => void
}

const state = new UpdaterReadyState()

export function initAutoUpdater(config: UpdaterConfig): void {
  state.reset()
  autoUpdater.logger = {
    info: (msg) => config.log.info(`[Updater] ${msg}`),
    warn: (msg) => config.log.warn(`[Updater] ${msg}`),
    error: (msg) => config.log.error(`[Updater] ${msg}`),
    debug: (msg) => config.log.info(`[Updater:debug] ${msg}`),
  }
  autoUpdater.autoDownload = false
  autoUpdater.autoInstallOnAppQuit = true
  autoUpdater.disableDifferentialDownload = config.disableDifferentialDownload ?? false

  autoUpdater.on('update-available', (info) => {
    state.markReady()
    config.log.info(`Update available: ${info.version}`)
    config.onAvailable?.({ version: info.version, releaseNotes: normalizeReleaseNotes(info.releaseNotes) })
    autoUpdater.downloadUpdate().catch((err: Error) => {
      config.log.warn(`Auto-download failed: ${err.message}`)
    })
  })
  autoUpdater.on('update-not-available', () => {
    config.log.info('No updates available')
  })
  autoUpdater.on('download-progress', (progress) => {
    config.onProgress?.({
      percent: Math.round(progress.percent),
      transferred: progress.transferred,
      total: progress.total,
    })
  })
  autoUpdater.on('update-downloaded', (info) => {
    config.log.info('Update downloaded, will install on quit')
    config.onDownloaded?.({ version: info.version, releaseNotes: normalizeReleaseNotes(info.releaseNotes) })
  })
  autoUpdater.on('error', (err) => {
    config.log.error(`Update error: ${err.message}`)
    config.onError?.(err)
  })

  setTimeout(() => {
    autoUpdater.checkForUpdates().catch((err: Error) => {
      config.log.warn(`Update check failed: ${err.message}`)
    })
  }, 5000)
}

export function downloadUpdate(): void {
  if (!state.isReady) {
    // Renderer triggered manual download before checkForUpdates resolved.
    // Re-trigger check; the update-available handler will start the download.
    autoUpdater.checkForUpdates().catch(() => {})
    return
  }
  autoUpdater.downloadUpdate().catch(() => {})
}

export function installUpdate(): void {
  autoUpdater.quitAndInstall(true, true)
}

function normalizeReleaseNotes(notes: unknown): string | null {
  return typeof notes === 'string' ? notes : null
}
