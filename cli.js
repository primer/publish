#!/usr/bin/env node
const publish = require('.')

const yargs = require('yargs')
  .option('dry-run', {
    describe: 'Print what will be done without doing it',
    type: 'boolean'
  })
  .option('message', {
    describe: 'The git commit message (not pushed)',
    alias: 'm',
    default: 'chore: npm version {version}'
  })

const options = yargs.argv

// eslint-disable-next-line no-unused-vars
publish(options, options._).then(published => {
  // derp
})
