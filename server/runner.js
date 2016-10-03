const Docker = require('dockerode');
const path = require('path');
const promisify = require('promisify-node');
const uuid = require('node-uuid');

const fs = promisify('fs');

const CERT_DIR = process.env.DOCKER_CERT_PATH;
const CODE_FOLDER = 'user-code';
const TMP_FOLDER = path.resolve(__dirname, '../sandboxes');

const docker = new Docker({
  protocol: 'https',
  host: '192.168.99.100',
  port: 2376,
  checkServerIdentity: false,
  ca: fs.readFileSync(`${CERT_DIR}/ca.pem`),
  cert: fs.readFileSync(`${CERT_DIR}/cert.pem`),
  key: fs.readFileSync(`${CERT_DIR}/key.pem`),
});

function randomId() {
  return uuid.v4();
}

function createTmpFolder(userCode, id) {
  const folderPath = path.resolve(TMP_FOLDER, `sandbox-${id}`);
  const useCodePath = path.join(folderPath, 'index.js');

  return fs.mkdir(folderPath)
    .then(() => fs.writeFile(useCodePath, userCode));
}

function createContainer(tmpFolder, id) {
  const containerConfig = {
    Image: 'node:6',
    Tty: true,
    WorkingDir: `/${CODE_FOLDER}`,
    Cmd: [
      'node', 'index.js',
    ],
    Labels: {
      'run-id': id,
      'code-path': tmpFolder,
    },
    HostConfig: {
      Binds: [
        `${tmpFolder}:/${CODE_FOLDER}`,
      ],
    },
  };

  return new Promise((resolve, reject) => {
    docker.createContainer(containerConfig, (err, res) => {
      if (err) {
        return reject(err);
      }

      return resolve(res);
    });
  });
}

function runnerStart({ container }, outputStream) {
  container.attach({ stream: true, stdout: true, stderr: true }, (err, stream) => {
    stream.pipe(outputStream);
  });

  return new Promise((resolve, reject) => container.start((err, res) => {
    if (err) {
      return reject(err);
    }

    return resolve(res);
  }));
}

function getRunnerLogs(containerId) {
  const formatLogs = logs => logs
    .split('\r\n')
    .filter(line => line && line.length)
    .map((entry) => {
      const firstWhiteSpace = entry.indexOf(' ');
      return {
        ts: entry.substring(0, firstWhiteSpace),
        msg: entry.substring(firstWhiteSpace),
      };
    });

  const container = docker.getContainer(containerId);
  return new Promise((resolve, reject) =>
    container.logs({
      stdout: true,
      stderr: true,
      follow: true,
      timestamps: true,
    }, (err, stream) => {
      if (err) {
        return reject(err);
      }

      let logs = '';
      stream.on('data', data => (logs += data.toString()));
      return stream.on('end', () => {
        const formattedLogs = formatLogs(logs);
        resolve(formattedLogs);
      });
    })
  );
}

function initRunner() {
  return new Promise((resolve, reject) =>
    docker.ping((err, res) => {
      if (err) {
        return reject(err);
      }

      return resolve(res);
    })
  );
}

function getRunner(runnerId) {
  if (!runnerId) {
    return null;
  }

  return new Promise((resolve, reject) =>
    docker.listContainers({
      all: true,
    }, (err, res) => {
      if (err) {
        return reject(err);
      }

      const matchingContainer = res
        .filter(({ Labels }) => Labels['run-id'] && Labels['run-id'] === runnerId)
        .pop();

      if (!matchingContainer) {
        return resolve(matchingContainer);
      }

      const container = docker.getContainer(matchingContainer.Id);
      const runner = {
        id: runnerId,
        container,
        run: () => runnerStart(runner, process.stdout),
      };

      return resolve(runner);
    })
  );
}

function createRunner(userCode) {
  const runnerId = randomId();

  return createTmpFolder(userCode, runnerId)
    .then(tmpFolder => createContainer(tmpFolder, runnerId))
    .then(() => getRunner(runnerId));
}

module.exports = {
  initRunner,
  createRunner,
  getRunnerLogs,
};
