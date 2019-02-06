module.exports = function runDry(cmd, args, execOpts = {}) {
  console.warn(`[run] ${cmd} ${JSON.stringify(args)} (${JSON.stringify(execOpts)})`)
  return Promise.resolve({stdout: '', stderr: ''})
}
