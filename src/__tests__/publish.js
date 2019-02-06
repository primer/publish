const actionStatus = require('action-status')
const execa = require('execa')
const mockedEnv = require('mocked-env')
const publish = require('../publish')
const readJSON = require('../read-json')
const {mockFiles} = require('./__utils')

jest.mock('action-status')
jest.mock('execa')
jest.mock('../read-json')

describe('publish()', () => {
  let restoreEnv = () => {}

  const execOpts = {stdio: 'inherit'}

  beforeEach(() => {
    execa.mockImplementation(() => Promise.resolve({stdout: '', stderr: ''}))
    actionStatus.mockImplementation(() => Promise.resolve())
  })

  afterEach(() => {
    restoreEnv()
    execa.mockClear()
    readJSON.mockClear()
  })

  it('throws if NPM_AUTH_TOKEN is falsy', () => {
    mockFiles({
      'package.json': {name: 'pkg', version: '1.0.0'}
    })
    mockEnv({NPM_AUTH_TOKEN: undefined})
    expect(() => publish()).toThrow()
    mockEnv({NPM_AUTH_TOKEN: ''})
    expect(() => publish()).toThrow()
  })

  it('does the right things on a feature branch', () => {
    mockEnv({
      GITHUB_REF: 'refs/heads/feature-x',
      GITHUB_SHA: 'deadfad',
      NPM_AUTH_TOKEN: 'secret'
    })
    mockFiles({
      'package.json': {name: 'pkg', version: '1.0.0'}
    })
    const version = '0.0.0-deadfad'
    return publish().then(() => {
      expect(execa).toHaveBeenCalledTimes(2)
      expect(execa).toHaveBeenNthCalledWith(1, 'npm', ['version', version], execOpts)
      expect(execa).toHaveBeenNthCalledWith(2, 'npm', ['publish', '--tag', 'canary', '--access', 'public'], execOpts)
    })
  })

  it('does the right things on a release branch', () => {
    mockEnv({
      GITHUB_REF: 'refs/heads/release-2.0.0',
      GITHUB_SHA: 'deadfad',
      NPM_AUTH_TOKEN: 'secret'
    })
    mockFiles({
      'package.json': {name: 'pkg', version: '1.0.0'}
    })
    const version = '2.0.0-rc.deadfad'
    return publish().then(() => {
      expect(execa).toHaveBeenCalledTimes(2)
      expect(execa).toHaveBeenNthCalledWith(1, 'npm', ['version', version], execOpts)
      expect(execa).toHaveBeenNthCalledWith(2, 'npm', ['publish', '--tag', 'next', '--access', 'public'], execOpts)
    })
  })

  it('does the right things on master', () => {
    const version = '1.1.0'
    mockEnv({
      GITHUB_REF: 'refs/heads/master',
      GITHUB_SHA: 'deadfad',
      NPM_AUTH_TOKEN: 'secret'
    })
    mockFiles({
      'package.json': {name: 'pkg', version}
    })
    return publish().then(() => {
      expect(execa).toHaveBeenCalledTimes(3)
      expect(execa).toHaveBeenNthCalledWith(1, 'npm', ['view', `pkg@${version}`, 'version'], {stderr: 'inherit'})
      expect(execa).toHaveBeenNthCalledWith(2, 'npm', ['publish', '--tag', 'latest', '--access', 'public'], execOpts)
      expect(execa).toHaveBeenNthCalledWith(3, 'git', ['push', '--tags', 'origin', 'HEAD:master'], execOpts)
    })
  })

  it('respects the "dryRun" option', () => {
    mockEnv({
      GITHUB_REF: 'refs/heads/run-dry',
      GITHUB_SHA: 'bedface',
      NPM_AUTH_TOKEN: 'secret'
    })
    mockFiles({
      'package.json': {name: 'pkg', version: '1.0.0'}
    })
    return publish({dryRun: true}).then(() => {
      expect(execa).toHaveBeenCalledTimes(0)
    })
  })

  function mockEnv(env) {
    restoreEnv = mockedEnv(env)
  }
})
