const interpolate = require('interpolate')
const readJSON = require('./read-json')
const getContext = require('./get-context')
const runDry = require('./run-dry')

module.exports = function publish(options, args = []) {
  const {NPM_AUTH_TOKEN} = process.env
  if (!NPM_AUTH_TOKEN) {
    throw new Error(`You must set the NPM_AUTH_TOKEN environment variable`)
  }

  const packageJson = readJSON('package.json')
  const {name} = packageJson

  const run = options.dryRun ? require('execa') : runDry

  return getContext(options).then(context => {
    const {version, tag} = context
    return run('npm', ['version', version, ...args])
      .then(() => {
        const message = interpolate(options.message, {name, version, tag})
        return run('git', ['commit', '-m', message, 'package*.json'])
      })
      .then(() => {
        return run('npm', ['publish', '--tag', tag, '--access', 'public'])
      })
  })
}
