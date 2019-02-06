const meta = require('github-action-meta')
const readJSON = require('./read-json')

const CONFIG_KEY = '@primer/publish'

const RELEASE_BRANCH_PATTERN = /^release-(.+)$/
const RELEASE_CANDIDATE_PREID = 'rc'
const RELEASE_CANDIDATE_TAG = 'next'

const CANARY_VERSION = '0.0.0'
const CANARY_PREID = ''
const CANARY_TAG = 'canary'

// eslint-disable-next-line no-unused-vars
module.exports = function getContext(options) {
  const packageJson = readJSON('package.json') || {}
  const {name} = packageJson
  // basic sanity checks
  /*
  if (packageJson.private === true) {
    throw new Error(`"private" is true in package.json; bailing`)
  } else if (!name) {
    throw new Error(`package.json is missing a "name" field`)
  }
  */
  const config = packageJson[CONFIG_KEY] || {}
  const {releaseBranch = 'master', releaseTag = 'latest'} = config

  let version
  let tag = releaseTag

  const {sha, branch} = meta.git
  if (branch === releaseBranch) {
    version = packageJson.version
  } else {
    let match
    const shortSha = sha.substr(0, 7)
    if ((match = branch.match(RELEASE_BRANCH_PATTERN))) {
      // TODO: add a pending check status to update package.json
      // if the version doesn't match!
      const v = match[1]
      const preid = RELEASE_CANDIDATE_PREID
      version = `${v}-${preid}.${shortSha}`
      tag = RELEASE_CANDIDATE_TAG
    } else {
      const v = CANARY_VERSION
      const preid = CANARY_PREID
      version = preid ? `${v}-${preid}.${shortSha}` : `${v}-${shortSha}`
      tag = CANARY_TAG
    }
  }

  return {name, version, tag, config, packageJson}
}
