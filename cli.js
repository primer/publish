#!/usr/bin/env node
const publish = require('./src/publish')

const yargs = require('yargs')
  .option('dry-run', {
    describe: 'Print what will be done without doing it',
    type: 'boolean'
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
