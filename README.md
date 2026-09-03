# electron-kit

Generic platform adapters for Electron's main process — file dialogs, the standard application menu,
and auto-update lifecycle wiring. Framework-neutral TypeScript, callback-based, no built-in strings.

Native platform integration only — atomic UI controls belong in
[`desktop-compact`](https://github.com/iyulab/desktop-compact); structural app-shell patterns belong
in [`desktop-patterns`](https://github.com/iyulab/desktop-patterns). This package knows about neither,
and knows nothing about any specific consuming application's IPC wiring, licensing, or telemetry — it
exposes callbacks, never invents an IPC channel name or calls into a consumer's own systems.

## Install

Requires Node ≥22.

```bash
npm install @iyulab/electron-kit electron electron-updater
```

`electron`/`electron-updater` are peer dependencies — install whatever version your app already uses.
Import only the modules you need — each ships as its own subpath:

```ts
import { openAndReadFile } from '@iyulab/electron-kit/dialogs'
import { applyAppMenu } from '@iyulab/electron-kit/app-menu'
import { initAutoUpdater } from '@iyulab/electron-kit/updater'
```

Or import everything via the barrel: `import { ... } from '@iyulab/electron-kit'`.

## Usage

### Dialogs

```ts
import { openAndReadFile, saveTextFile, selectDirectory } from '@iyulab/electron-kit/dialogs'

const result = await openAndReadFile('Open a project file', [{ name: 'JSON', extensions: ['json'] }])
if (result) console.log(result.path, result.content)
```

### Application menu

```ts
import { applyAppMenu } from '@iyulab/electron-kit/app-menu'

applyAppMenu({
  labels: {
    file: 'File', quit: 'Quit', edit: 'Edit', undo: 'Undo', redo: 'Redo',
    cut: 'Cut', copy: 'Copy', paste: 'Paste', selectAll: 'Select All',
    view: 'View', reload: 'Reload', devTools: 'Developer Tools',
    resetZoom: 'Reset Zoom', zoomIn: 'Zoom In', zoomOut: 'Zoom Out', fullscreen: 'Toggle Fullscreen',
    help: 'Help', showShortcuts: 'Keyboard Shortcuts', documentation: 'Documentation', reportIssue: 'Report Issue',
  },
  helpUrl: 'https://example.com/docs',
  onShowShortcuts: () => mainWindow.webContents.send('your-app:show-shortcuts'),
})
```

There is no built-in locale set or default labels — every string is supplied by the caller (see
"Application-protocol boundary" below for why `onShowShortcuts` is a callback, not a channel name this
package picks for you).

### Auto-updater

```ts
import { initAutoUpdater, downloadUpdate, installUpdate } from '@iyulab/electron-kit/updater'

initAutoUpdater({
  log: { info: console.log, warn: console.warn, error: console.error },
  onAvailable: (info) => mainWindow.webContents.send('your-app:update-available', info),
  onProgress: (progress) => mainWindow.webContents.send('your-app:update-progress', progress),
  onDownloaded: () => mainWindow.webContents.send('your-app:update-ready'),
})
```

## Application-protocol boundary

This package never invents IPC channel names or picks which `BrowserWindow` to send to — that's your
app's own wire protocol, not this library's schema. Every place the original platform behavior would
need to reach into your app (a shortcuts-overlay trigger, an update-progress notification) is exposed
as a plain callback instead; what you do inside it — which channel, which window, whether you also
call your own telemetry — is entirely up to you. A CI guard in this repo enforces the "no direct
`webContents.send()`" half of this at the library level.

## Modules

| Module | Description |
|---|---|
| `dialogs` | `openAndReadFile`/`saveTextFile`/`saveBufferFile`/`selectDirectory` — thin wrappers around `dialog.showOpenDialog`/`showSaveDialog` |
| `app-menu` | `buildAppMenu`/`applyAppMenu` — the standard File/Edit/View/Help menu template, fully consumer-labeled, DevTools visibility auto-derived from `app.isPackaged` when not given explicitly |
| `updater` | `initAutoUpdater`/`downloadUpdate`/`installUpdate` — wraps `electron-updater`'s check→download→install lifecycle, reporting through callbacks instead of directly touching any window or telemetry system |

Each module that has any decision logic beyond a direct platform-API call splits it into an
electron-import-free `*-logic.ts` sibling (`dialogs-logic.ts`, `app-menu-logic.ts`,
`updater-logic.ts`) — the `electron`/`electron-updater` packages cannot be imported at all outside an
actual Electron process (their plain-Node entry points are just binary-path strings, not the real
API), so this split is what makes any of this package's decision logic unit-testable under plain
Node.

## Development

```bash
npm install
npm test               # node:test via tsx, real Chromium not required (no UI here)
npm run typecheck
npm run guard           # forge-ignorance + application-protocol scan (this package must stay domain-neutral and never invent IPC channel names)
npm run build            # per-module ESM output, type declarations
```

The three literal platform calls this package wraps (`dialog.showOpenDialog`/`showSaveDialog`,
`Menu.setApplicationMenu`, `autoUpdater.checkForUpdates`/`downloadUpdate`) need a real Electron
process with a display to exercise directly — everything decidable without one already has test
coverage; these need integration testing inside a consuming app.

## License

MIT
