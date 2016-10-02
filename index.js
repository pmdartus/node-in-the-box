'use strict';

const crypto = require('crypto');
const Docker = require('dockerode');
const fs = require('fs');
const path = require('path');

const certDir = process.env.DOCKER_CERT_PATH;
const CODE_FOLDER = 'user-code';
const userCodePath = path.resolve(__dirname, CODE_FOLDER);

function randomId() {
  return crypto.randomBytes(20).toString();
}

function createContainer(dockerInstance) {
  const containerConfig = {
    Image: 'node:6',
    Tty: true,
    WorkingDir: `/${CODE_FOLDER}`,
    Cmd: [
      'node', 'index.js'
    ],
    HostConfig: {
      Binds: [
        `${userCodePath}:/${CODE_FOLDER}`
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
  })
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

var docker = new Docker({
  protocol: 'https',
  host: '192.168.99.100',
  port: 2376,
  checkServerIdentity: false,
  ca: fs.readFileSync(certDir + '/ca.pem'),
  cert: fs.readFileSync(certDir + '/cert.pem'),
  key: fs.readFileSync(certDir + '/key.pem')
});

createContainer(docker)
.then(container => runContainer(container, process.stdout))
.catch(err => console.error(err))

