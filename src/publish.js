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

  return getContext(options).then(context => {
    const {name, version, tag, packageJson} = context
    const {sha} = meta.git

    // this is true if we think we're publishing the version that's in git
    const isLatest = packageJson.version === version

    return (context.status ? publishStatus(context, context.status) : Promise.resolve())
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
          const {GITHUB_TOKEN} = process.env
          if (!GITHUB_TOKEN) {
            console.warn(`[publish] GITHUB_TOKEN is not set; skipping tag`)
            return context
          }

          const tagContext = 'git tag'
          const tag = `v${version}`

          const Octokit = require('@octokit/rest')
          const github = new Octokit({auth: `token ${GITHUB_TOKEN}`})
          const {repo} = meta

          return publishStatus(context, {
            context: tagContext,
            state: 'pending',
            description: `Tagging the release as "${tag}"...`
          })
            .then(() =>
              github.git.createTag({
                owner: repo.owner,
                repo: repo.name,
                object: sha,
                message: `chore: tag ${tag}`
              })
            )
            .then(() =>
              publishStatus(context, {
                context: tagContext,
                state: 'success',
                description: `Tagged ${sha.substr(0, 7)} as "${tag}"`
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
