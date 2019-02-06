module.exports = function runDry(cmd, args, execOpts = {}) {
  console.warn(`[dry-run] ${cmd} ${JSON.stringify(args)} (execOpts: ${JSON.stringify(execOpts)})`)
  return Promise.resolve({stdout: '', stderr: ''})
}
