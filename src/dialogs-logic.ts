/**
 * Pure decision logic for `dialogs.ts`, deliberately kept in a module that
 * never imports `electron` — an ES module with a static `import { x } from
 * 'electron'` fails at *load* time (not call time) when run outside an
 * actual Electron process, because the `electron` npm package's plain-Node
 * entry point is just a binary-path string with no named exports, and ESM
 * named-import bindings are validated at module-instantiation time
 * regardless of whether the binding is ever used. Splitting this out is
 * what makes it possible to unit-test under plain `node --test`/`tsx` at
 * all — see docs/superpowers/specs/2026-09-02-electron-kit-design.md,
 * "테스트 전략".
 */

export interface OpenDialogLikeResult {
  canceled: boolean
  filePaths: string[]
}

export interface SaveDialogLikeResult {
  filePath?: string
}

export function resolveOpenDialogPath(result: OpenDialogLikeResult): string | null {
  if (result.canceled || !result.filePaths[0]) return null
  return result.filePaths[0]
}

export function resolveSaveDialogPath(result: SaveDialogLikeResult): string | null {
  return result.filePath || null
}
