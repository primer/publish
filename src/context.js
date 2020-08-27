const path = require('path')
const meta = require('github-action-meta')
const readJSON = require('./read-json')

const CONFIG_KEY = '@primer/publish'

const RELEASE_BRANCH_PATTERN = /^release-(.+)$/
const RELEASE_CANDIDATE_PREID = 'rc'
const RELEASE_CANDIDATE_TAG = 'next'

const CANARY_VERSION = '0.0.0'
const CANARY_TAG = 'canary'

module.exports = function getContext({dir = '.'} = {}) {
  const packageJson = readJSON(path.join(dir, 'package.json'))
  if (!packageJson) {
    throw new Error(`Unable to read package.json in ${path.join(process.cwd(), dir)}!`)
  }
  const {name} = packageJson

  // basic sanity checks
  if (packageJson.private === true) {
    throw new Error(`"private" is true in package.json; bailing`)
  } else if (!name) {
    throw new Error(`package.json is missing a "name" field`)
  }

  const config = packageJson[CONFIG_KEY] || {}
  const {releaseBranch = 'master', releaseTag = 'latest'} = config

  let version
  let status
  let tag = releaseTag

  const {sha, branch} = meta.git
  const repo = meta.repo.toString()

  // if the action is called on the primary branch, then the
  // current version in package.json is the version you should publish
  if (branch === releaseBranch) {
    version = packageJson.version
  } else {
    let match
    const shortSha = sha.substr(0, 7)
    // find the version from the release branch name?
    if ((match = branch.match(RELEASE_BRANCH_PATTERN))) {
      const v = match[1]
      status = Object.assign(
        {
          context: `npm version`
        },
        // if the release branch name matches the name in package.json send success message
        // otherwise send and error
        v === packageJson.version
          ? {
              state: 'success',
              description: v
            }
          : {
              state: 'pending',
              description: `Remember to set "version": "${v}" in package.json`,
              url: `https://github.com/${repo}/edit/${branch}/package.json`
            }
      )
      const preid = RELEASE_CANDIDATE_PREID
      version = `${v}-${preid}.${shortSha}`
      tag = RELEASE_CANDIDATE_TAG
    } else {
      // if it's not a release branch or a merge to the primary branch,
      // cut a canary version
      const v = CANARY_VERSION
      version = `${v}-${shortSha}`
      tag = CANARY_TAG
    }
  }

  return Promise.resolve({name, version, tag, config, packageJson, status})
}
