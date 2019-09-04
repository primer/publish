const core = require('@actions/core')
const publish = require('./src/publish')

process.env.NPM_AUTH_TOKEN = core.getInput('npm-auth-token', {required: true})

publish({npmArgs: ['--unsafe-perm']})
  .then(context => {
    core.debug(`published: ${JSON.stringify(context)}`)
  })
  .catch(error => {
    core.error(error)
    core.setFailed(error.message)
  })
