#!/usr/bin/env node
const publish = require('./src/publish')

const yargs = require('yargs')
  .option('dry-run', {
    describe: 'Print what will be done without doing it',
    type: 'boolean'
  })
  .option('folder', {
    describe: 'A folder containing a package.json file',
    type: 'string',
    default: '.'
  })
  .alias('help', 'h')

const options = yargs.argv

if (options.help) {
  yargs.showHelp()
  process.exit(0)
}

const npmArgs = options._
delete options._

console.warn(`[publish] options: ${JSON.stringify(options, null, 2)}`)
console.warn(`[publish] npm args: ${JSON.stringify(npmArgs, null, 2)}`)

publish(options, npmArgs)
  .then(context => {
    console.warn(`published! ${JSON.stringify(context, null, 2)}`)
  })
  .catch(error => {
    console.error(error)
    process.exitCode = 1
  })
