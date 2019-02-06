const actionStatus = require('action-status')
const getContext = require('./get-context')
const runDry = require('./run-dry')

module.exports = function publish(options = {}, npmArgs = []) {
  if (!process.env.NPM_AUTH_TOKEN) {
    throw new Error(`You must set the NPM_AUTH_TOKEN environment variable`)
  }

  const context = getContext(options)
  const {name, version, tag, packageJson} = context

  const run = options.dryRun ? runDry : require('execa')
  const execOpts = {stdio: 'inherit'}

  return Promise.resolve()
    .then(() => {
      if (packageJson.version === version) {
        console.warn(`[publish] skipping "npm version" because "${version}" matches package.json`)
        return ensureUnpublished()
      } else {
        return publishStatus({
          state: 'pending',
          description: `npm version ${version}`
        }).then(() => run('npm', [...npmArgs, 'version', version], execOpts))
      }
    })
    .then(() =>
      publishStatus({
        state: 'pending',
        description: `npm publish --tag ${tag}`
      })
    )
    .then(() => run('npm', [...npmArgs, 'publish', '--tag', tag, '--access', 'public'], execOpts))
    .then(() =>
      publishStatus({
        state: 'success',
        description: version,
        url: `https://unpkg.com/${name}@${version}/`
      })
    )
    .then(() => context)

  function ensureUnpublished() {
    return run('npm', ['view', `${name}@${version}`, 'version'], {stderr: 'inherit'}).then(({stdout}) => {
      if (stdout === version) {
        throw new Error(`${name}@${version} is already published!`)
      }
    })
  }

  function publishStatus(props = {}) {
    return actionStatus(
      Object.assign(
        {
          context: `publish ${name}`,
          // note: these need to be empty so that action-status
          // doesn't throw an error w/o "required" env vars
          description: '',
          url: ''
        },
        props
      )
    )
  }
}
