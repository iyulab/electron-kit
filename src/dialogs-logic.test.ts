import { test } from 'node:test'
import assert from 'node:assert/strict'
import { resolveOpenDialogPath, resolveSaveDialogPath } from './dialogs-logic.js'

test('resolveOpenDialogPath returns the first selected path', () => {
  assert.equal(resolveOpenDialogPath({ canceled: false, filePaths: ['/a/b.txt'] }), '/a/b.txt')
})

test('resolveOpenDialogPath returns null when canceled', () => {
  assert.equal(resolveOpenDialogPath({ canceled: true, filePaths: ['/a/b.txt'] }), null)
})

test('resolveOpenDialogPath returns null when no path was selected', () => {
  assert.equal(resolveOpenDialogPath({ canceled: false, filePaths: [] }), null)
})

test('resolveSaveDialogPath returns the chosen path', () => {
  assert.equal(resolveSaveDialogPath({ filePath: '/a/out.txt' }), '/a/out.txt')
})

test('resolveSaveDialogPath returns null when no path was chosen (dialog dismissed)', () => {
  assert.equal(resolveSaveDialogPath({}), null)
})

test('resolveSaveDialogPath returns null for an empty-string path', () => {
  assert.equal(resolveSaveDialogPath({ filePath: '' }), null)
})
