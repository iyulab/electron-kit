import { test } from 'node:test'
import assert from 'node:assert/strict'
import { UpdaterReadyState } from './updater-logic.js'

test('starts not ready', () => {
  const state = new UpdaterReadyState()
  assert.equal(state.isReady, false)
})

test('markReady flips isReady to true', () => {
  const state = new UpdaterReadyState()
  state.markReady()
  assert.equal(state.isReady, true)
})

test('reset flips isReady back to false', () => {
  const state = new UpdaterReadyState()
  state.markReady()
  state.reset()
  assert.equal(state.isReady, false)
})

test('reset before any markReady is a no-op (stays false)', () => {
  const state = new UpdaterReadyState()
  state.reset()
  assert.equal(state.isReady, false)
})

test('each instance tracks its own state independently', () => {
  const a = new UpdaterReadyState()
  const b = new UpdaterReadyState()
  a.markReady()
  assert.equal(a.isReady, true)
  assert.equal(b.isReady, false)
})
