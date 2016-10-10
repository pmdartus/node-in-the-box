// @flow

const path = require('path');
const uuid = require('node-uuid');
const Docker = require('dockerode');

const Sandbox = require('./sandbox');
const CancellationToken = require('./cancellation-token');
const {
  createTmpContainer,
  createTmpSandboxDirectory,

  ensureDockerConnection,
  startContainer,
  waitContainer,
} = require('./execution-helpers');

type RunConfig = {
  timeout?: number
}

function runContainer(
  container: any,
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
  }, (err, stream) => {
    stream.pipe(process.stdout);
  });

  return startContainer(container).then(() => (
    Promise.race([
      new Promise(resolve => token.subscribe(resolve)),
      waitContainer(container),
    ])
  ));
}

function runSandbox(
  sandbox: Sandbox,
  docker: any,
  runConfig: RunConfig,
): Promise<> {
  const {
    timeout = 30 * 1000,
  } = runConfig;

  const token = new CancellationToken();
  const timeoutId = setTimeout(() => (
    token.cancel(`Execution canceled: Not completed before ${(timeout / 1000).toFixed(0)}s.`)
  ), timeout);

  const runPromise = createTmpSandboxDirectory(sandbox, () => (
      createTmpContainer(sandbox, docker,
        container => runContainer(container, token)
      )
    )
  );

  return runPromise.then(() => (
    clearTimeout(timeoutId)
  ));
}

class SandboxManager {
  sandboxesPath: string
  _isInit: boolean
  _docker: any

  constructor(sandboxesPath: string) {
    this.sandboxesPath = sandboxesPath;

    this._docker = null;
    this._isInit = false;
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
    return runSandbox(sandbox, this._docker, config);
  }
}

module.exports = SandboxManager;
