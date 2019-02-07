const mockedEnv = require('mocked-env')
const getContext = require('../context')
const readJSON = require('../read-json')
const {mockFiles} = require('./__utils')

jest.mock('../read-json')

describe('getContext()', () => {
  const defaultPackageJson = {
    name: 'default-package',
    version: '0.0.1'
  }

  let restoreEnv = () => {}

  beforeEach(() => {
    mockFiles({'package.json': defaultPackageJson})
  })

  afterEach(() => {
    restoreEnv()
    readJSON.mockReset()
  })

  it('throws if it is unable to read package.json', () => {
    mockFiles({})
    expect(() => getContext()).toThrow()
  })

  it('throws if "private": true in package.json', () => {
    mockFiles({'package.json': {private: true}})
    expect(() => getContext()).toThrow()
  })

  it('throws if there is no "name" field in package.json', () => {
    mockFiles({'package.json': {name: ''}})
    expect(() => getContext()).toThrow()
  })

  it('gets the canary version by default', () => {
    mockEnv({
      GITHUB_REF: 'refs/heads/feat-x',
      GITHUB_SHA: '50faded'
    })
    return getContext().then(context => {
      expect(context.version).toBe('0.0.0-50faded')
      expect(context.tag).toBe('canary')
    })
  })

  it('gets the release candidate version if the branch matches /^release-/', () => {
    mockEnv({
      GITHUB_REF: 'refs/heads/release-1.0.0',
      GITHUB_SHA: 'deadfad'
    })
    return getContext().then(context => {
      expect(context.version).toBe('1.0.0-rc.deadfad')
      expect(context.tag).toBe('next')
    })
  })

  it('generates a pending "npm version" status for release branches', () => {
    mockFiles({
      'package.json': {name: 'foo', version: '0.4.2'}
    })
    mockEnv({
      GITHUB_REF: 'refs/heads/release-1.0.0',
      GITHUB_REPOSITORY: 'primer/foo',
      GITHUB_SHA: 'deadfad'
    })
    return getContext().then(context => {
      expect(context.status).toEqual({
        context: 'npm version',
        state: 'pending',
        description: `Remember to set "version": "1.0.0" in package.json`,
        url: 'https://github.com/primer/foo/edit/release-1.0.0/package.json'
      })
    })
  })

  it('generates a success "npm version" status for release branches', () => {
    mockFiles({
      'package.json': {name: 'foo', version: '1.0.0'}
    })
    mockEnv({
      GITHUB_REF: 'refs/heads/release-1.0.0',
      GITHUB_REPOSITORY: 'primer/foo',
      GITHUB_SHA: 'deadfad'
    })
    return getContext().then(context => {
      expect(context.packageJson).toEqual({name: 'foo', version: '1.0.0'})
      expect(context.status).toEqual({
        context: 'npm version',
        state: 'success',
        description: '1.0.0'
      })
    })
  })

  it('gets the version from package.json if the branch is "master"', () => {
    const version = '2.0.1'
    mockFiles({
      'package.json': {name: 'mooch', version}
    })
    mockEnv({GITHUB_REF: 'refs/heads/master'})
    return getContext().then(context => {
      expect(context.version).toBe(version)
      expect(context.tag).toBe('latest')
    })
  })

  function mockEnv(env) {
    restoreEnv = mockedEnv(env)
  }
})
