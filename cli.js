#!/usr/bin/env node
const publish = require('./src/publish')

const yargs = require('yargs')
  .option('dry-run', {
    describe: 'Print what will be done without doing it',
    type: 'boolean'
  })
  .alias('help', 'h')

const options = yargs.argv

if (options.help) {
  yargs.showHelp()
  process.exit(0)
}

publish(options, options._)
  .then(context => {
    console.warn(`published! ${JSON.stringify(context, null, 2)}`)
  })
  .catch(error => {
    console.error(error)
    process.exitCode = 1
  })
