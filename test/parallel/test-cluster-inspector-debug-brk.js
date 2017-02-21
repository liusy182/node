'use strict';
// Flags: --inspect={PORT}
const common = require('../common');
const assert = require('assert');
const cluster = require('cluster');
const debuggerPort = common.PORT;

const script = common.fixturesDir + '/empty.js';

function fail() {
  assert(0); // `node --debug-brk script.js` should not quit
}

if (cluster.isMaster) {

  function fork(offset, execArgv) {
    if (execArgv)
      cluster.setupMaster({execArgv});

    let worker = cluster.fork({portSet: debuggerPort + offset});

    worker.on('exit', fail);
    // give node time to start up the debugger
    setTimeout(() => {
      worker.removeListener('exit', fail);
      worker.kill();
    }, 2000);
    return worker;
  }

  assert.strictEqual(process.debugPort, debuggerPort);
  let workers = [
    fork(1, [script, '--inspect-brk']),
    fork(2, [script, `--inspect-brk=${debuggerPort}`]),
    fork(3, [script, '--debug-brk']),
    fork(4, [script, `--debug-brk=${debuggerPort}`])
  ];

  process.on('exit', function() {
    workers.map((wk) => {
      assert.equal(wk.process.killed, true);
    });
  });
} 
