#!/usr/bin/env node
const publish = require('./src/publish')
const {DEFAULT_MESSAGE} = require('./src/constants')

const yargs = require('yargs')
  .option('dry-run', {
    describe: 'Print what will be done without doing it',
    type: 'boolean'
  })
  .option('message', {
    describe: 'The git commit message (not pushed)',
    alias: 'm',
    default: DEFAULT_MESSAGE
  })

const options = yargs.argv

publish(options, options._)
  .then(context => {
    console.warn(`published! ${JSON.stringify(context, null, 2)}`)
  })
  .catch(error => {
    console.error(error)
    process.exitCode = 1
  })
