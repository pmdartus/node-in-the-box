// @flow

const fs = require('fs');
const path = require('path');

// Check for default config
let dockerConfig = {
  socketPath: '/var/run/docker.sock',
};

// Check for docker machine running
if (process.env.DOCKER_MACHINE_NAME) {
  const CERT_DIR = process.env.DOCKER_CERT_PATH;
  if (!CERT_DIR) {
    throw new Error('CERT_DIR env variable is needed to connect to docker');
  }

  dockerConfig = {
    protocol: 'https',
    host: process.env.DOCKER_HOSTNAME || '192.168.99.100',
    port: process.env.DOCKER_PORT || 2376,
    checkServerIdentity: false,
    ca: fs.readFileSync(`${CERT_DIR}/ca.pem`),
    cert: fs.readFileSync(`${CERT_DIR}/cert.pem`),
    key: fs.readFileSync(`${CERT_DIR}/key.pem`),
  };
}

module.exports = {
  PORT: process.env.PORT || 3000,
  SANBOXES_FOLDER: process.env.SANBOXES_FOLDER || path.resolve(__dirname, '../sandboxes'),
  dockerConfig,
};
