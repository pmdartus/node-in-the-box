'use strict';

const Docker = require('dockerode');
const fs = require('fs');
const path = require('path');
const uuid = require('node-uuid');

const CERT_DIR = process.env.DOCKER_CERT_PATH;
const CODE_FOLDER = 'user-code';
const TMP_FOLDER = '/tmp';

const docker = new Docker({
  protocol: 'https',
  host: '192.168.99.100',
  port: 2376,
  checkServerIdentity: false,
  ca: fs.readFileSync(CERT_DIR + '/ca.pem'),
  cert: fs.readFileSync(CERT_DIR + '/cert.pem'),
  key: fs.readFileSync(CERT_DIR + '/key.pem')
});

const runners = [];

function randomId() {
  return uuid.v4();
}

function createTmpFolder(userCode, id) {
  const folderPath = path.resolve(TMP_FOLDER, `sandbox-${id}`);
  const useCodePath = path.join(folderPath, 'index.js');

  return new Promise((resolve, reject) => {
    fs.mkdir(folderPath, err => {
      if (err) {
        return reject(err);
      }

      fs.writeFile(useCodePath, userCode, (err) => {
        if (err) {
           return reject(err);
        }

        resolve(folderPath);
      });
    })
  });
}

function createContainer(tmpFolder, id) {
  const containerConfig = {
    Image: 'node:6',
    Tty: true,
    WorkingDir: `/${CODE_FOLDER}`,
    Cmd: [
      'node', 'index.js'
    ],
    Labels: {
      'sandbox-id': id,
    },
    HostConfig: {
      Binds: [
        `${tmpFolder}:/${CODE_FOLDER}`
      ]
    }
  };

  return new Promise((resolve, reject) => {
    docker.createContainer(containerConfig, (err, res) => {
      if (err) {
        return reject(err);
      }

      resolve(res);
    });
  });
}

function runContainer(container, outputStream) {
  container.attach({stream: true, stdout: true, stderr: true}, function (err, stream) {
    stream.pipe(outputStream);
  });

  return new Promise((resolve, reject) => container.start((err, res) => {
    if (err) {
      return reject(err);
    }

    resolve(res);
  }));
}

function runnerStatus(runner) {
  const {
    id, 
    container,
  } = runner;

  return new Promise((resolve, reject) => {
    return container.logs((err, res) => {
      if (err) {
        return reject(err);
      }

      return resolve({
        id: runner.id,
        logs: res
      })
    });
  })
}

function initRunner() {
  return new Promise((resolve, reject) => {
    return docker.ping((err, res) => {
      if (err) {
        return reject(err)
      }

      resolve(res);
    });
  });
}

function newRunner(userCode) {
  const runnerId = randomId();
  let codePath = null;

  return createTmpFolder(userCode, runnerId)
    .then(tmpFolder => {
      codePath = tmpFolder
      return createContainer(tmpFolder, runnerId);
    })
    .then(container => {
      const runner = {
        id: runnerId,
        codePath,
        container,
        run: () => runContainer(container, process.stdout),
        status: () => runnerStatus(runner),
      };
      runners.push(runner);

      return runner; 
    });
}

function getRunner(runnerId) {
  if (!runnerId) {
    return null;
  }

  return runners
    .filter(runner => runnerId === runner.id)
    .pop();
}

module.exports = {
  initRunner,
  newRunner,
  getRunner,
}

