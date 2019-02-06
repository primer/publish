const interpolate = require('interpolate')
const getContext = require('./get-context')
const runDry = require('./run-dry')
const {DEFAULT_MESSAGE} = require('./constants')

module.exports = function publish(options = {}, npmArgs = []) {
  if (!process.env.NPM_AUTH_TOKEN) {
    throw new Error(`You must set the NPM_AUTH_TOKEN environment variable`)
  }

  const context = getContext(options)
  const {version, tag} = context
  const {message = DEFAULT_MESSAGE} = options

  const run = options.dryRun ? runDry : require('execa')
  return Promise.resolve()
    .then(() => run('npm', [...npmArgs, 'version', version]))
    .then(() => run('git', ['commit', '-m', interpolate(message, context), 'package*.json']))
    .then(() => run('npm', [...npmArgs, 'publish', '--tag', tag, '--access', 'public']))
    .then(() => context)
}
