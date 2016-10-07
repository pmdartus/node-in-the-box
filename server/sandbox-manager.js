const path = require('path');
const Docker = require('dockerode');
const uuid = require('node-uuid');
const promisify = require('promisify-node');

const fs = promisify('fs');

const CODE_FILE_NAME = 'index.js';
const LOG_FILE_NAME = 'run.logs';

class Sandbox {
  constructor(docker, sandboxesPath, content, pubsub) {
    this.id = uuid.v1();
    this._containerId = null;
    this._container = null;
    this._sandboxPath = path.resolve(sandboxesPath, this.id);
    this._codePath = path.resolve(this._sandboxPath, CODE_FILE_NAME);
    this._logPath = path.resolve(this._sandboxPath, LOG_FILE_NAME);

    this._docker = docker;
    this._content = content;
    this._pubsub = pubsub;
  }

  _publish(key, payload) {
    return this._pubsub.publish(key, {
      id: this.id,
      payload,
    });
  }

  subscribe(key, cb) {
    return this._pubsub.subscribe(key, cb);
  }

  _prepare() {
    return fs.mkdir(this._sandboxPath)
      .then(() => fs.writeFile(this._codePath, this._content));
  }

  _createContainer() {
    const containerConfig = {
      Image: 'node:6',
      Tty: true,
      Cmd: ['node', CODE_FILE_NAME],
      Labels: {
        id: this.id,
        sandboxesPath: this._sandboxPath,
      },
      HostConfig: {
        Binds: [`${this._codePath}/:/${CODE_FILE_NAME}`],
      },
    };

    return new Promise((resolve, reject) => {
      this._docker.createContainer(containerConfig, (err, container) => {
        if (err) {
          return reject(err);
        }

        this._container = container;
        this._containerId = container.id;
        return resolve(container);
      });
    });
  }

  _start(container) {
    const logStream = fs.createWriteStream(this._logPath);

    container.attach({
      stream: true,
      stdout: true,
      stderr: true,
      timestamps: true,
    }, (err, stream) => {
      stream.pipe(logStream);
      stream.on('data', chunk => (
        this._publish('log', { entry: chunk.toString() })
      ));
    });

    return new Promise((resolve, reject) => container.start((err, res) => {
      if (err) {
        return reject(err);
      }

      this._publish('start', res);

      return resolve(res);
    }));
  }

  _waitForContainer(container) {
    return new Promise((resolve, reject) => (
      container.wait((err, res) => {
        if (err) {
          return reject(err);
        }

        this._publish('done', res);
        return resolve(res);
      })
    ));
  }

  _removeContainer(container) {
    return new Promise((resolve, reject) => (
      container.remove((err, res) => {
        if (err) {
          return reject(err);
        }

        this._publish('removed', res);
        return resolve(res);
      })
    ));
  }

  init() {
    return Promise.resolve()
      .then(() => this._prepare())
      .then(() => this._createContainer());
  }

  run() {
    return Promise.resolve(this._container)
      .then(container => (
        this._start(container)
          .then(() => this._waitForContainer(container))
          .then(() => this._removeContainer(container))
      ));
  }

  cancel() {
    console.log('cancel', this._content);
    this._publish('canceled', {});
  }
}

class SandboxManager {
  constructor(dockerConfig, sandboxesPath, pubsub) {
    this._docker = null;
    this._pubsub = pubsub;
    this._dockerConfig = dockerConfig;
    this._sandboxesPath = sandboxesPath;
    this._sandboxes = [];

    this._isInit = false;
  }

  init() {
    return new Promise((resolve, reject) => {
      try {
        this._docker = new Docker(this._dockerConfig);
      } catch (error) {
        reject(error);
      }

      this._docker.ping((err) => {
        if (err) {
          reject(err);
        }

        this._isInit = true;
        resolve();
      });
    });
  }

  createSandboxe(content) {
    if (!this._isInit) {
      throw new Error('SandboxManager should be initialized first');
    }

    return new Sandbox(this._docker, this._sandboxesPath, content, this._pubsub);
  }

  stopAll() {
    return Promise.all(
      this._sandoxes.map(sandobx => sandobx.cancel())
    );
  }

  getLogs(sandboxId) {
    if (!sandboxId) {
      throw new Error('getLogs requieres a sandbox id');
    }

    const sandboxPath = path.resolve(this._sandboxesPath, sandboxId);
    const logFile = path.resolve(sandboxPath, LOG_FILE_NAME);
    return fs.stat(sandboxPath)
      .then(() => fs.readFile(logFile, 'UTF-8'))
      .then(fileContent => fileContent.split('\r\n'));
  }
}

module.exports = SandboxManager;
