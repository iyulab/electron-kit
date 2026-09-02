import { app, Menu, shell } from 'electron'
import { buildAppMenu, resolveIsDev, type BuildAppMenuConfig } from './app-menu-logic.js'

export type { AppMenuLabels, BuildAppMenuConfig } from './app-menu-logic.js'
export { buildAppMenu } from './app-menu-logic.js'

/**
 * Apply the standard File/Edit/View/Help application menu. Convenience
 * wrapper around `Menu.setApplicationMenu(Menu.buildFromTemplate(buildAppMenu(...)))`
 * that also supplies Electron-native defaults `buildAppMenu` itself can't
 * (it stays electron-import-free): `isDev` falls back to `!app.isPackaged`
 * when omitted, and `onOpenUrl` falls back to `shell.openExternal` when
 * omitted.
 *
 * Consumers needing custom template modification beyond `fileMenuPrepend`/
 * `customMenus` should call `buildAppMenu(...)` directly and pass the
 * result through `Menu.buildFromTemplate(...)` themselves.
 */
export function applyAppMenu(config: BuildAppMenuConfig): void {
  const template = buildAppMenu({
    ...config,
    isDev: resolveIsDev(config.isDev, app.isPackaged),
    onOpenUrl: config.onOpenUrl ?? ((url) => void shell.openExternal(url)),
  })
  Menu.setApplicationMenu(Menu.buildFromTemplate(template))
}
