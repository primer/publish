const meta = require('github-action-meta')
const actionStatus = require('action-status')
const getContext = require('./get-context')
const runDry = require('./run-dry')

module.exports = function publish(options = {}, npmArgs = []) {
  if (!process.env.NPM_AUTH_TOKEN) {
    throw new Error(`You must set the NPM_AUTH_TOKEN environment variable`)
  }

  const context = getContext(options)
  const {name, version, tag, packageJson} = context
  const isLatest = packageJson.version === version
  const {branch, sha} = meta.git

  const run = options.dryRun ? runDry : require('execa')
  const execOpts = {stdio: 'inherit'}

  return Promise.resolve()
    .then(() => {
      if (isLatest) {
        console.warn(`[publish] skipping "npm version" because "${version}" matches package.json`)
        return checkPublished().then(published => {
          if (published) {
            console.warn(`[publish] ${version} is already published; exiting with neutral status`)
            // see: <https://developer.github.com/actions/creating-github-actions/accessing-the-runtime-environment/#exit-codes-and-statuses>
            process.exit(78)
          }
        })
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
    .then(() => {
      if (isLatest) {
        const context = 'publish/git'
        return publishStatus({
          context,
          state: 'pending',
          description: `git push --tags origin ${branch}`
        })
          .then(() => run('git', ['push', '--tags', 'origin', branch], execOpts))
          .then(() =>
            publishStatus({
              context,
              state: 'success',
              description: `Pushed ${branch} to ${sha.substr(0, 7)}`
            })
          )
      }
    })
    .then(() => context)

  function checkPublished() {
    return run('npm', ['view', `${name}@${version}`, 'version'], {stderr: 'inherit'}).then(({stdout}) => {
      return stdout === version
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
