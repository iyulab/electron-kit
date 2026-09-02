import { test } from 'node:test'
import assert from 'node:assert/strict'
import { buildAppMenu, resolveIsDev, type AppMenuLabels } from './app-menu-logic.js'

const LABELS: AppMenuLabels = {
  file: 'File',
  quit: 'Quit',
  edit: 'Edit',
  undo: 'Undo',
  redo: 'Redo',
  cut: 'Cut',
  copy: 'Copy',
  paste: 'Paste',
  selectAll: 'Select All',
  view: 'View',
  reload: 'Reload',
  devTools: 'Developer Tools',
  resetZoom: 'Reset Zoom',
  zoomIn: 'Zoom In',
  zoomOut: 'Zoom Out',
  fullscreen: 'Toggle Fullscreen',
  help: 'Help',
  showShortcuts: 'Keyboard Shortcuts',
  documentation: 'Documentation',
  reportIssue: 'Report Issue',
}

function submenuOf(template: ReturnType<typeof buildAppMenu>, label: string) {
  const entry = template.find((m) => m.label === label)
  assert.ok(entry, `expected a top-level menu labeled "${label}"`)
  return entry!.submenu as ReturnType<typeof buildAppMenu>
}

test('builds exactly File/Edit/View with no Help menu when nothing triggers one', () => {
  const template = buildAppMenu({ labels: LABELS })
  assert.deepEqual(
    template.map((m) => m.label),
    ['File', 'Edit', 'View']
  )
})

test('File menu is just Quit when no fileMenuPrepend is given', () => {
  const file = submenuOf(buildAppMenu({ labels: LABELS }), 'File')
  assert.deepEqual(
    file.map((m) => m.role ?? m.type),
    ['quit']
  )
})

test('File menu prepends app-specific items with a separator before Quit', () => {
  const file = submenuOf(
    buildAppMenu({ labels: LABELS, fileMenuPrepend: [{ label: 'New Project' }] }),
    'File'
  )
  assert.deepEqual(
    file.map((m) => m.label ?? m.type),
    ['New Project', 'separator', 'Quit']
  )
  assert.equal(file[2].role, 'quit')
})

test('View menu omits DevTools when isDev is false', () => {
  const view = submenuOf(buildAppMenu({ labels: LABELS, isDev: false }), 'View')
  assert.ok(!view.some((m) => m.role === 'toggleDevTools'))
})

test('View menu includes DevTools when isDev is true', () => {
  const view = submenuOf(buildAppMenu({ labels: LABELS, isDev: true }), 'View')
  assert.ok(view.some((m) => m.role === 'toggleDevTools'))
})

test('Help menu does not appear when helpUrl/issueUrl/onShowShortcuts are all absent', () => {
  const template = buildAppMenu({ labels: LABELS })
  assert.ok(!template.some((m) => m.label === 'Help'))
})

test('Help menu appears with only the showShortcuts entry when onShowShortcuts is given', () => {
  const template = buildAppMenu({ labels: LABELS, onShowShortcuts: () => {} })
  const help = submenuOf(template, 'Help')
  assert.deepEqual(
    help.map((m) => m.label),
    ['Keyboard Shortcuts']
  )
})

test('helpUrl/issueUrl entries are hidden without an onOpenUrl callback (no dead buttons)', () => {
  const template = buildAppMenu({ labels: LABELS, helpUrl: 'https://example.com/docs' })
  assert.ok(!template.some((m) => m.label === 'Help'))
})

test('helpUrl/issueUrl entries appear and call onOpenUrl with the right URL when clicked', () => {
  const opened: string[] = []
  const template = buildAppMenu({
    labels: LABELS,
    helpUrl: 'https://example.com/docs',
    issueUrl: 'https://example.com/issues',
    onOpenUrl: (url) => opened.push(url),
  })
  const help = submenuOf(template, 'Help')
  assert.deepEqual(
    help.map((m) => m.label),
    ['Documentation', 'Report Issue']
  )
  help[0].click?.(null as never, undefined, null as never)
  help[1].click?.(null as never, undefined, null as never)
  assert.deepEqual(opened, ['https://example.com/docs', 'https://example.com/issues'])
})

test('onShowShortcuts click handler is actually invoked, not just referenced', () => {
  let calls = 0
  const template = buildAppMenu({ labels: LABELS, onShowShortcuts: () => { calls++ } })
  const help = submenuOf(template, 'Help')
  help[0].click?.(null as never, undefined, null as never)
  assert.equal(calls, 1)
})

test('customMenus are appended after Help', () => {
  const template = buildAppMenu({
    labels: LABELS,
    onShowShortcuts: () => {},
    customMenus: [{ label: 'Debug' }],
  })
  assert.deepEqual(
    template.map((m) => m.label),
    ['File', 'Edit', 'View', 'Help', 'Debug']
  )
})

test('resolveIsDev prefers the explicit value when given', () => {
  assert.equal(resolveIsDev(true, false), true)
  assert.equal(resolveIsDev(false, true), false)
})

test('resolveIsDev falls back to !appIsPackaged when omitted', () => {
  assert.equal(resolveIsDev(undefined, true), false)
  assert.equal(resolveIsDev(undefined, false), true)
})
