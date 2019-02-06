const mockedEnv = require('mocked-env')
const getContext = require('../get-context')
const readJSON = require('../read-json')

jest.mock('../read-json')

describe('getContext()', () => {
  let restoreEnv = () => {}

  afterEach(() => {
    restoreEnv()
    readJSON.mockReset()
  })

  it('gets the canary version by default', () => {
    mockEnv({
      GITHUB_REF: 'refs/heads/feat-x',
      GITHUB_SHA: '50faded'
    })
    const {version, tag} = getContext()
    expect(version).toBe('0.0.0-sha.50faded')
    expect(tag).toBe('canary')
  })

  it('gets the release candidate version if the branch matches /^release-/', () => {
    mockEnv({
      GITHUB_REF: 'refs/heads/release-1.0.0',
      GITHUB_SHA: 'deadfad'
    })
    const {version, tag} = getContext()
    expect(version).toBe('1.0.0-next.deadfad')
    expect(tag).toBe('next')
  })

  it('gets the version from package.json if the branch is "master"', () => {
    const version = '2.0.1'
    mockFiles({
      'package.json': {version}
    })
    mockEnv({GITHUB_REF: 'refs/heads/master'})
    const context = getContext()
    expect(context.version).toBe(version)
    expect(context.tag).toBe('latest')
  })

  function mockEnv(env) {
    restoreEnv = mockedEnv(env)
  }

  function mockFiles(files) {
    readJSON.mockImplementation(path => {
      if (path in files) {
        return files[path]
      }
    })
  }
})
