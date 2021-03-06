// @flow

const fs = require('fs-promise');

const Sandbox = require('./sandbox');
const CancellationToken = require('./cancellation-token');
const {
  DockerConnectionError,
} = require('./errors');

/**
 * Pull a container
 */
function pullContainer(containerName: string, docker: any) {
  return new Promise((resolve, reject) => (
    docker.pull(containerName, (err, stream) => {
      if (err) {
        return reject(err);
      }

      return docker.modem.followProgress(stream, (processErr, res) => {
        if (processErr) {
          return reject(processErr);
        }

        return resolve(res);
      });
    })
  ));
}

/**
 * Create a container based on a container config from the Remote API
 */
function createContainer(config: Object, docker: any): Promise<> {
  return new Promise((resolve, reject) => (
    docker.createContainer(config, (err, container) => (
      err ? reject(err) : resolve(container)
    ))
  )).catch((err) => {
    if (err.statusCode !== 404) {
      throw err;
    }

    // Pull the container if not found
    return pullContainer(config.Image, docker)
    .then(() => (
      createContainer(config, docker)
    ));
  });
}

/**
 * Remove a container
 */
function removeContainer(container: any): Promise<> {
  return new Promise((resolve, reject) => (
    container.remove(err => (err ? reject(err) : resolve()))
  ));
}

/**
 * Stop a container if it is running
 */
function stopContainer(container: any): Promise<> {
  return new Promise((resolve, reject) => (
    container.inspect((err, { State }) => {
      if (err) {
        return reject(err);
      }

      return State.Running ?
        container.stop(stopErr => (stopErr ? reject(stopErr) : resolve())) :
        resolve();
    })
  ));
}

/**
 * Creates a temp directory with the sandbox files
 * The directory gets deleted once the childTask promise is settled
 */
function createTmpSandboxDirectory(
  sandbox: Sandbox,
  childTask: () => Promise<>,
  token?: CancellationToken,
): Promise<> {
  if (token && token.isCanceled()) {
    return Promise.resolve();
  }

  const cleanup = () => fs.remove(sandbox.sandboxPath);

  return fs.outputFile(sandbox.getCodePath(), sandbox.content)
    .then(childTask)
    .then(cleanup, err => (
      cleanup()
        .then(() => Promise.reject(err))
    ));
}

/**
 * Creates a temp container used to execute a sandbox
 * The container gets deleted once the childTask is settled
 */
function createTmpContainer(
  sandbox: Sandbox,
  docker: any,
  childTask: (container: any) => Promise<>,
  token?: CancellationToken,
): Promise<> {
  if (token && token.isCanceled()) {
    return Promise.resolve();
  }

  return createContainer(sandbox.getContainerConfig(), docker).then(container => (
    childTask(container)
      .then(
        () => removeContainer(container),
        err => (
          removeContainer(container)
            .then(() => Promise.reject(err))
        ),
      )
  ));
}

/**
 * Make sure that the connection is established with the docker host
 */
function ensureDockerConnection(docker: any): Promise<> {
  return new Promise((resolve, reject) => (
    docker.ping(err => (
      err ? reject(new DockerConnectionError(err)) : resolve()
    ))
  ));
}

/**
 * Start the execution of a container
 * The Promise is reject if the start attemp fail
 */
function startContainer(container: any): Promise<> {
  return new Promise((resolve, reject) => (
    container.start(err => (err ? reject(err) : resolve()))
  ));
}

/**
 * Returns a Promise that will be settled once the container has finished it execution
 */
function waitContainer(container: any): Promise<> {
  return new Promise((resolve, reject) => (
    container.wait((err, res) => (err ? reject(err) : resolve(res)))
  ));
}

/**
 * Attach logger and state update to a sandbox and print info to stdout
 */
function attachDebugListener(sandbox: Sandbox) {
  sandbox.subsribe('log', ({ payload }) => {
    process.stdout.write(`[${sandbox.id} - Log] ${payload.msg}`);
  });

  sandbox.subsribe('stateChange', ({ payload }) => {
    const { state, oldState } = payload;
    console.log(`[${sandbox.id} - StateUpdate] ${oldState} ==> ${state}`);
  });
}

module.exports = {
  createTmpSandboxDirectory,
  createTmpContainer,

  ensureDockerConnection,
  startContainer,
  waitContainer,
  stopContainer,

  attachDebugListener,
};
