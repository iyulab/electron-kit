import { test } from 'node:test'
import assert from 'node:assert/strict'
import { UpdaterReadyState, isUnreachableUpdateError } from './updater-logic.js'

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

test('network and server failures are unreachable, not defects', () => {
  assert.equal(isUnreachableUpdateError({ message: 'net::ERR_CONNECTION_RESET' }), true)
  assert.equal(isUnreachableUpdateError({ message: 'getaddrinfo ENOTFOUND github.com' }), true)
  assert.equal(isUnreachableUpdateError({ message: 'request failed', code: 'ETIMEDOUT' }), true)
  assert.equal(isUnreachableUpdateError({ message: 'HttpError: 404 "method: GET url: https://example.com/latest.yml"' }), true)
  assert.equal(isUnreachableUpdateError({ message: 'HttpError: 503 Service Unavailable' }), true)
})

test('anything else stays an error', () => {
  assert.equal(isUnreachableUpdateError({ message: 'sha512 checksum mismatch' }), false)
  assert.equal(isUnreachableUpdateError({ message: 'HttpError: 401 Unauthorized' }), false)
  assert.equal(isUnreachableUpdateError({ message: 'Cannot find latest.yml in the latest release artifacts' }), false)
})
