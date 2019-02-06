const actionStatus = require('action-status')
const interpolate = require('interpolate')
const getContext = require('./get-context')
const runDry = require('./run-dry')
const {DEFAULT_MESSAGE} = require('./constants')

module.exports = function publish(options = {}, npmArgs = []) {
  if (!process.env.NPM_AUTH_TOKEN) {
    throw new Error(`You must set the NPM_AUTH_TOKEN environment variable`)
  }

  const context = getContext(options)
  const {name, version, tag} = context
  const {message = DEFAULT_MESSAGE} = options
  const files = 'package*.json'

  const run = options.dryRun ? runDry : require('execa')
  return Promise.resolve()
    .then(() =>
      publishStatus({
        state: 'pending',
        description: `npm version ${version}`
      })
    )
    .then(() => run('npm', [...npmArgs, 'version', version]))
    .then(() =>
      publishStatus({
        state: 'pending',
        description: `git commit -a ${files}`
      })
    )
    .then(() => run('git', ['commit', '-m', interpolate(message, context), files]))
    .then(() =>
      publishStatus({
        state: 'pending',
        description: `npm publish --tag ${tag}`
      })
    )
    .then(() => run('npm', [...npmArgs, 'publish', '--tag', tag, '--access', 'public']))
    .then(() =>
      publishStatus({
        state: 'success'
      })
    )
    .then(() => context)

  function publishStatus(props = {}) {
    return actionStatus(
      Object.assign(
        {
          context: `publish ${name}`
        },
        props
      )
    )
  }
}
