import * as log from 'loglevel'

// Adjusting log level for debugging can be done here, or in specific tests that need more finegrained logging during development
const level = 2
const logLevels = ['TRACE', 'DEBUG', 'INFO', 'WARN', 'ERROR', 'SILENT']
function setupLogging () {
  log.getLogger('disciplLawReg').setLevel(logLevels[level])
}

export {
  setupLogging
}
