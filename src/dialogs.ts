import { dialog } from 'electron'
import { readFileSync, writeFileSync } from 'node:fs'
import { resolveOpenDialogPath, resolveSaveDialogPath } from './dialogs-logic.js'

export { resolveOpenDialogPath, resolveSaveDialogPath } from './dialogs-logic.js'

export interface FileFilter {
  name: string
  extensions: string[]
}

export async function openAndReadFile(
  title: string,
  filters: FileFilter[]
): Promise<{ path: string; content: string } | null> {
  const result = await dialog.showOpenDialog({
    title,
    filters,
    properties: ['openFile'],
  })
  const path = resolveOpenDialogPath(result)
  if (!path) return null
  const content = readFileSync(path, 'utf-8')
  return { path, content }
}

export async function saveTextFile(
  title: string,
  defaultPath: string,
  filters: FileFilter[],
  content: string
): Promise<string | null> {
  const result = await dialog.showSaveDialog({ title, defaultPath, filters })
  const filePath = resolveSaveDialogPath(result)
  if (!filePath) return null
  writeFileSync(filePath, content, 'utf-8')
  return filePath
}

export async function saveBufferFile(
  title: string,
  defaultPath: string,
  filters: FileFilter[],
  buffer: Buffer
): Promise<string | null> {
  const result = await dialog.showSaveDialog({ title, defaultPath, filters })
  const filePath = resolveSaveDialogPath(result)
  if (!filePath) return null
  writeFileSync(filePath, buffer)
  return filePath
}

export async function selectDirectory(title: string): Promise<string | null> {
  const result = await dialog.showOpenDialog({
    title,
    properties: ['openDirectory'],
  })
  return resolveOpenDialogPath(result)
}
