#!/usr/bin/env node
const publish = require('./src/publish')

const npmArgs = process.env.INPUT_NPM_ARGS
const options = JSON.parse(process.env.INPUT_OPTIONS)


console.log(`[publish] options🌈: ${options}`)
console.log(`[publish] npm args🌈: ${npmArgs}`)

publish(options, npmArgs)
  .then(context => {
    console.warn(`published! ${JSON.stringify(context, null, 2)}`)
  })
  .catch(error => {
    console.error(error)
    process.exitCode = 1
  })
