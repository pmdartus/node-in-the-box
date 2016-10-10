// @flow

const fs = require('fs-promise');
const Sandbox = require('./sandbox');

function createContainer(config: Object, docker: any): Promise<> {
  return new Promise((resolve, reject) => (
    docker.createContainer(config, (err, container) => (
      err ? reject(err) : resolve(container)
    ))
  ));
}

function removeContainer(container: any): Promise<> {
  return new Promise((resolve, reject) => (
    container.remove(err => (err ? reject(err) : resolve()))
  ));
}

/**
 * Creates a temp directory with the sandbox files
 * The directory gets deleted once the childTask promise is settled
 */
function createTmpSandboxDirectory(
  sandbox: Sandbox,
  childTask: () => Promise<>,
): Promise<> {
  const cleanup = () => fs.remove(sandbox.sandboxPath);

  return fs.outputFile(sandbox.getCodePath(), sandbox.content)
    .then(childTask)
    .then(cleanup, cleanup);
}

/**
 * Creates a temp container used to execute a sandbox
 * The container gets deleted once the childTask is settled
 */
function createTmpContainer(
  sandbox: Sandbox,
  docker: any,
  childTask: (container: any) => Promise<>,
): Promise<> {
  return createContainer(sandbox.getContainerConfig(), docker).then(container => (
    Promise.resolve(childTask(container))
      .then(
        () => removeContainer(container),
        () => removeContainer(container),
      )
  ));
}

/**
 * Make sure that the connection is established with the docker host
 */
function ensureDockerConnection(docker: any): Promise<> {
  return new Promise((resolve, reject) => (
    docker.ping(err => (err ? reject(err) : resolve()))
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
    container.wait(err => (err ? reject(err) : resolve()))
  ));
}

module.exports = {
  createTmpSandboxDirectory,
  createTmpContainer,

  ensureDockerConnection,
  startContainer,
  waitContainer,
};
