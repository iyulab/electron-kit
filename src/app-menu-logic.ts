import type { MenuItemConstructorOptions } from 'electron'

/**
 * Pure decision logic for `app-menu.ts`, deliberately electron-import-free —
 * same reasoning as `dialogs-logic.ts`. `MenuItemConstructorOptions` is a
 * type-only import (erased at compile time, no runtime binding), so it's
 * safe here even though the `electron` module itself cannot be loaded
 * outside an actual Electron process.
 */

export interface AppMenuLabels {
  file: string
  quit: string
  edit: string
  undo: string
  redo: string
  cut: string
  copy: string
  paste: string
  selectAll: string
  view: string
  reload: string
  devTools: string
  resetZoom: string
  zoomIn: string
  zoomOut: string
  fullscreen: string
  help: string
  showShortcuts: string
  documentation: string
  reportIssue: string
}

export interface BuildAppMenuConfig {
  /**
   * Every menu-item label, supplied by the consumer — this package has no
   * built-in strings and no notion of which locales exist (see
   * docs/superpowers/specs/2026-09-02-electron-kit-design.md, "i18n — 없음").
   */
  labels: AppMenuLabels
  /** Show the DevTools entry under View. */
  isDev?: boolean
  /** External URL for Help → Documentation. Omit to hide the entry. */
  helpUrl?: string
  /** External URL for Help → Report Issue. Omit to hide the entry. */
  issueUrl?: string
  /**
   * App-specific items prepended to the File menu (e.g. "New Project"). A
   * separator is inserted automatically before the trailing `Quit` entry
   * when this array is non-empty.
   */
  fileMenuPrepend?: MenuItemConstructorOptions[]
  /** Additional top-level menus appended after Help. */
  customMenus?: MenuItemConstructorOptions[]
  /**
   * Called when the consumer clicks the Help → "show shortcuts" entry — only
   * rendered when this is supplied. This package does not know what a
   * shortcuts overlay is or how to trigger one; the consumer decides (e.g.
   * sending its own app's IPC message to the focused window).
   */
  onShowShortcuts?: () => void
  /**
   * Called to open `helpUrl`/`issueUrl`. The actual platform call
   * (`shell.openExternal`) lives in `app-menu.ts`, not here — this function
   * stays electron-import-free.
   */
  onOpenUrl?: (url: string) => void
}

/**
 * Build the standard File/Edit/View/Help application menu template.
 *
 * Structure (all entries always present unless noted):
 * - **File**: [app-specific items] → separator → Quit
 * - **Edit**: Undo / Redo / Cut / Copy / Paste / Select All
 * - **View**: Reload / DevTools (when `isDev`) / Reset Zoom / Zoom In / Zoom Out / Toggle Fullscreen
 * - **Help**: shown only when it would have at least one entry (show-shortcuts / Documentation / Report Issue)
 */
export function buildAppMenu(config: BuildAppMenuConfig): MenuItemConstructorOptions[] {
  const t = config.labels
  const prepend = config.fileMenuPrepend ?? []

  const fileSubmenu: MenuItemConstructorOptions[] = [
    ...prepend,
    ...(prepend.length > 0 ? [{ type: 'separator' as const }] : []),
    { role: 'quit', label: t.quit },
  ]

  const editSubmenu: MenuItemConstructorOptions[] = [
    { role: 'undo', label: t.undo },
    { role: 'redo', label: t.redo },
    { type: 'separator' },
    { role: 'cut', label: t.cut },
    { role: 'copy', label: t.copy },
    { role: 'paste', label: t.paste },
    { role: 'selectAll', label: t.selectAll },
  ]

  const viewSubmenu: MenuItemConstructorOptions[] = [
    { role: 'reload', label: t.reload },
    ...(config.isDev ? [{ role: 'toggleDevTools' as const, label: t.devTools }] : []),
    { type: 'separator' },
    { role: 'resetZoom', label: t.resetZoom },
    { role: 'zoomIn', label: t.zoomIn },
    { role: 'zoomOut', label: t.zoomOut },
    { type: 'separator' },
    { role: 'togglefullscreen', label: t.fullscreen },
  ]

  const helpSubmenu: MenuItemConstructorOptions[] = []
  if (config.onShowShortcuts) {
    const onShowShortcuts = config.onShowShortcuts
    helpSubmenu.push({ label: t.showShortcuts, click: () => onShowShortcuts() })
  }
  if (config.helpUrl && config.onOpenUrl) {
    const url = config.helpUrl
    const onOpenUrl = config.onOpenUrl
    helpSubmenu.push({ label: t.documentation, click: () => onOpenUrl(url) })
  }
  if (config.issueUrl && config.onOpenUrl) {
    const url = config.issueUrl
    const onOpenUrl = config.onOpenUrl
    helpSubmenu.push({ label: t.reportIssue, click: () => onOpenUrl(url) })
  }

  const template: MenuItemConstructorOptions[] = [
    { label: t.file, submenu: fileSubmenu },
    { label: t.edit, submenu: editSubmenu },
    { label: t.view, submenu: viewSubmenu },
  ]

  if (helpSubmenu.length > 0) {
    template.push({ label: t.help, submenu: helpSubmenu })
  }

  if (config.customMenus && config.customMenus.length > 0) {
    template.push(...config.customMenus)
  }

  return template
}

/**
 * `isDev` resolution: use the caller's explicit value when given, otherwise
 * derive it from Electron's own `app.isPackaged` (inverted) — replaces the
 * original's `@electron-toolkit/utils` `is.dev` dependency, which this
 * package doesn't need (Electron already exposes this natively). Pure so
 * it's testable without Electron; `app-menu.ts` supplies the real
 * `app.isPackaged` value.
 */
export function resolveIsDev(explicit: boolean | undefined, appIsPackaged: boolean): boolean {
  return explicit ?? !appIsPackaged
}
