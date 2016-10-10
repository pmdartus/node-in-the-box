// @flow

const path = require('path');

type State =
  | 'PENDING'
  | 'RUNNING'
  | 'SUCCESS'
  | 'FAILED';

const CODE_FILE_NAME = 'index.js';

class Sandbox {
  id: string
  content: string
  sandboxPath: string
  state: State

  constructor(
    id: string,
    sandboxPath: string,
    content: string,
  ) {
    this.id = id;
    this.content = content;
    this.sandboxPath = sandboxPath;

    this.state = 'PENDING';
  }

  getCodePath(): string {
    return path.resolve(this.sandboxPath, CODE_FILE_NAME);
  }

  getContainerConfig(): Object {
    return {
      Image: 'node:6',
      Tty: true,
      Cmd: ['node', CODE_FILE_NAME],
      Labels: {
        id: this.id,
        sandboxesPath: this.sandboxPath,
      },
      HostConfig: {
        Binds: [`${this.getCodePath()}/:/${CODE_FILE_NAME}`],
      },
    };
  }
}

module.exports = Sandbox;
