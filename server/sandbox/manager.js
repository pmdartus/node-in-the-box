// @flow

const path = require('path');
const Docker = require('dockerode');
const uuid = require('node-uuid');

const Sandbox = require('./sandbox');
const CancellationToken = require('./cancellation-token');
const {
  createTmpContainer,
  createTmpSandboxDirectory,

  ensureDockerConnection,
  startContainer,
  waitContainer,
  stopContainer,
} = require('./helpers');

type RunConfig = {
  timeout?: number
}

function runContainer(
  container: any,
  sandbox: Sandbox,
  token: CancellationToken,
): Promise<> {
  if (token.isCanceled()) {
    return Promise.resolve();
  }

  container.attach({
    stream: true,
    stdout: true,
    stderr: true,
    timestamps: true,
  }, (err, stream) => (
    stream.on('data', data => (
      sandbox.log(new Date().toUTCString(), data.toString())
    ))
  ));

  return startContainer(container).then(() => {
    const cancel = new Promise(resolve => token.subscribe(resolve));
    const wait = waitContainer(container).then(({ StatusCode }) => (
      StatusCode === 0 ? Promise.resolve() : Promise.reject(`Exited with status code ${StatusCode}`)
    ));

    return Promise.race([
      cancel,
      wait,
    ]).then(() => (
      stopContainer(container)
    ));
  });
}

function runSandbox(
  sandbox: Sandbox,
  docker: any,
  runConfig: RunConfig = {},
  token: CancellationToken,
): Promise<> {
  const {
    timeout = 30 * 1000,
  } = runConfig;

  const timeoutId = setTimeout(() => (
    token.cancel(`Execution canceled: Not completed before ${(timeout / 1000).toFixed(0)}s.`)
  ), timeout);

  const runPromise = createTmpSandboxDirectory(sandbox, () => (
    createTmpContainer(sandbox, docker, (container) => {
      sandbox.setState('RUNNING');
      return runContainer(container, sandbox, token);
    }, token)
  ), token);

  const start = new Date();
  sandbox.setStartTs(start);

  let failure = null;
  return runPromise
    .catch(err => (failure = err))
    .then(() => {
      clearTimeout(timeoutId);

      sandbox.setDuration(new Date() - start);
      if (token.isCanceled() || failure) {
        sandbox.setState('FAILED');
      } else {
        sandbox.setState('SUCCESS');
      }
    });
}

class SandboxManager {
  sandboxesPath: string
  _isInit: boolean
  _docker: any
  _sandboxCancelationMap: Map<Sandbox, CancellationToken>

  constructor(sandboxesPath: string) {
    this.sandboxesPath = sandboxesPath;

    this._docker = null;
    this._isInit = false;
    this._sandboxCancelationMap = new Map();
  }

  init(dockerConfig: Object): Promise<> {
    this._docker = new Docker(dockerConfig);
    return ensureDockerConnection(this._docker)
      .then(() => (this._isInit = true));
  }

  createSandboxe(content: string): Sandbox {
    if (!this._isInit) {
      throw new Error('SandboxManager should be initialized first');
    }

    const id = uuid.v1();
    const sandboxPath = path.resolve(this.sandboxesPath, id);
    return new Sandbox(id, sandboxPath, content);
  }

  run(sandbox: Sandbox, config: RunConfig): Promise<> {
    // Create a cancelation token for the sandbox and register it in the map
    const cancellation = new CancellationToken();
    this._sandboxCancelationMap.set(sandbox, cancellation);

    // Start the sandbox
    return runSandbox(sandbox, this._docker, config, cancellation).then(() => (
      this._sandboxCancelationMap.delete(sandbox)
    ));
  }

  cancel(sandbox: Sandbox) {
    // Check if the sandbox is registered
    if (!this._sandboxCancelationMap.has(sandbox)) {
      throw new Error(`Try to cancel a not running sandbox ${sandbox.id}`);
    }

    // Get token and cancel it if present
    const cancelation = this._sandboxCancelationMap.get(sandbox);
    if (cancelation != null && !cancelation.isCanceled()) {
      cancelation.cancel();
    }
  }
}

module.exports = SandboxManager;
