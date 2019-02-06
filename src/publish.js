const meta = require('github-action-meta')
const actionStatus = require('action-status')
const getContext = require('./context')
const runDry = require('./run-dry')

module.exports = function publish(options = {}, npmArgs = []) {
  if (!process.env.NPM_AUTH_TOKEN) {
    throw new Error(`You must set the NPM_AUTH_TOKEN environment variable`)
  }

  const run = options.dryRun ? runDry : require('execa')
  const execOpts = {stdio: 'inherit'}

  const context = getContext(options)

  return getContext(options).then(context => {
    const {name, version, tag, packageJson, pendingStatus} = context
    const {branch, sha} = meta.git

    // this is true if we think we're publishing the version that's in git
    const isLatest = packageJson.version === version

    const init = pendingStatus ? publishStatus(context, pendingStatus) : Promise.resolve()
    return init
      .then(() => {
        if (isLatest) {
          console.warn(`[publish] skipping "npm version" because "${version}" matches package.json`)
          // this is a fairly reliable way to determine whether the package@version is published
          return run('npm', ['view', `${name}@${version}`, 'version'], {stderr: 'inherit'})
            .then(({stdout}) => stdout === version)
            .then(published => {
              if (published) {
                console.warn(`[publish] ${version} is already published; exiting with neutral status`)
                // see: <https://developer.github.com/actions/creating-github-actions/accessing-the-runtime-environment/#exit-codes-and-statuses>
                process.exit(78)
              }
            })
        } else {
          return publishStatus(context, {
            state: 'pending',
            description: `npm version ${version}`
          }).then(() => run('npm', [...npmArgs, 'version', version], execOpts))
        }
      })
      .then(() =>
        publishStatus(context, {
          state: 'pending',
          description: `npm publish --tag ${tag}`
        })
      )
      .then(() => run('npm', [...npmArgs, 'publish', '--tag', tag, '--access', 'public'], execOpts))
      .then(() =>
        publishStatus(context, {
          state: 'success',
          description: version,
          url: `https://unpkg.com/${name}@${version}/`
        })
      )
      .then(() => {
        if (isLatest) {
          const context = 'publish/git'
          return publishStatus(context, {
            context,
            state: 'pending',
            description: `Running: git push --tags origin ${branch}`
          })
            .then(() => run('git', ['push', '--tags', 'origin', `HEAD:${branch}`], execOpts))
            .then(() =>
              publishStatus(context, {
                context,
                state: 'success',
                description: `Pushed ${branch} to ${sha.substr(0, 7)}`
              })
            )
        }
      })
      .then(() => context)
  })
}

function publishStatus(context, options = {}) {
  return actionStatus(
    Object.assign(
      {
        context: `publish ${context.name}`,
        // note: these need to be empty so that action-status
        // doesn't throw an error w/o "required" env vars
        description: '',
        url: ''
      },
      options
    )
  )
}
