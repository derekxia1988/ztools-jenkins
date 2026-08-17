import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

function readJson(path: string) {
  return JSON.parse(readFileSync(resolve(path), 'utf8'))
}

describe('plugin packaging metadata', () => {
  it('uses the published Jenkins Lite id throughout the project', () => {
    const packageJson = readJson('package.json')
    const pluginJson = readJson('plugin.json')
    const devPluginJson = readJson('public/plugin.json')

    expect(packageJson.name).toBe('jenkins-lite')
    expect(pluginJson.name).toBe('jenkins-lite')
    expect(devPluginJson.name).toBe('jenkins-lite')
  })

  it('points development mode at the configured Vite port', () => {
    const devPluginJson = readJson('public/plugin.json')

    expect(devPluginJson.development.main).toBe('http://localhost:5180')
  })

  it('marks the packaged plugin root as CommonJS for preload.js', () => {
    expect(existsSync(resolve('public/package.json'))).toBe(true)
    expect(readJson('public/package.json').type).toBe('commonjs')
  })
})
