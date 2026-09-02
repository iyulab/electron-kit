#!/usr/bin/env node
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'

// forge-ignorance — same list as desktop-compact/desktop-patterns (this repo
// must not know forge domain concepts either).
const FORGE_PATTERNS = [
  /forge/i,
  /license/i,
  /telemetry/i,
  /\.fex\b/i,
  /engine:/i,
  /guard/i,
]

// application-protocol ignorance — this repo exposes callbacks only; it must
// never invent its own IPC channel names by calling webContents.send()
// directly. See docs/superpowers/specs/2026-09-02-electron-kit-design.md,
// "Application-protocol 경계".
const PROTOCOL_PATTERNS = [/webContents\.send/]

export const FORBIDDEN_PATTERNS = [...FORGE_PATTERNS, ...PROTOCOL_PATTERNS]

export function findForbiddenTokens(rootDir) {
  const violations = []

  const walk = (dir) => {
    for (const entry of readdirSync(dir)) {
      const fullPath = join(dir, entry)
      const stat = statSync(fullPath)
      if (stat.isDirectory()) {
        walk(fullPath)
        continue
      }
      if (!entry.endsWith('.ts')) continue
      const content = readFileSync(fullPath, 'utf8')
      content.split('\n').forEach((line, i) => {
        for (const pattern of FORBIDDEN_PATTERNS) {
          if (pattern.test(line)) {
            violations.push(`${fullPath}:${i + 1}: matches ${pattern} — "${line.trim()}"`)
          }
        }
      })
    }
  }

  walk(rootDir)
  return violations
}

function main() {
  const violations = findForbiddenTokens(join(process.cwd(), 'src'))
  if (violations.length > 0) {
    console.error('forge-ignorance/application-protocol guard failed — forbidden tokens found in src/:\n')
    violations.forEach((v) => console.error('  ' + v))
    process.exit(1)
  }
  console.log('forge-ignorance/application-protocol guard passed — no forbidden tokens in src/.')
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main()
}
