// @flow

const path = require('path');

const Manager = require('../manager');
const Sandbox = require('../sandbox');
const config = require('../../config');
const {
  DockerConnectionError,
} = require('../errors');

const SANDBOXES_PATH = path.resolve(__dirname, '../../../sandboxes-test');

function createManager(dockerConfig = config.dockerConfig): Promise<Manager> {
  const manager = new Manager(SANDBOXES_PATH);
  return manager.init(dockerConfig)
    .then(() => manager);
}

function runScript(content, runConfig = {}) {
  return createManager().then((manager) => {
    const sandbox = manager.createSandboxe(content);
    return manager.run(sandbox, runConfig)
      .then(() => sandbox);
  });
}

describe('Manager', () => {
  it('creates and init a manager using docker config', () => (
    createManager()
  ));

  it('creates and init a manager using docker config', () => {
    const fakeConfig = {
      foo: 'bar',
    };
    const manager = new Manager(SANDBOXES_PATH);
    return manager.init(fakeConfig)
      .catch((err) => {
        expect(err instanceof DockerConnectionError);
        expect(err.response).not.toBeNull();
      });
  });

  it('thorws when creating a sandbox before init', () => {
    const manager = new Manager(SANDBOXES_PATH);
    return expect(() => manager.createSandboxe('return true;'))
      .toThrowError('init');
  });

  it('creates sandbox return a new Sandbox instance', () => (
    createManager().then((manager) => {
      const sandbox = manager.createSandboxe('');
      expect(sandbox instanceof Sandbox);
    })
  ));
});

describe('Execution', () => {
  it('executes simple script', () => (
    runScript('process.exit(0)')
  ));

  it('sets sandbox set state and complementary info', () => (
    runScript('process.exit(0)').then((sandbox) => {
      expect(sandbox.state).toBe('SUCCESS');
      expect(sandbox.duration).toBeGreaterThan(0);
      expect(sandbox.startTs).not.toBeNull();
    })
  ));

  it('sets sandbox set state to FAILED when the exit is different than 0', () => (
    runScript('process.exit(1)').then(({ state }) => {
      expect(state).toBe('FAILED');
    })
  ));

  it('sets sandbox set state to FAILED when an error is thrown', () => (
    runScript('throw new Error("I failed")').then(({ state }) => {
      expect(state).toBe('FAILED');
    })
  ));

  it('captures logs', () => (
    runScript(`
      console.log('Hello');
      console.error('World');
    `).then(({ logEntries }) => {
      const logs = logEntries.map(({ msg }) => msg);
      expect(logs.length).toBe(2);
      expect(logs).toEqual(['Hello\r\n', 'World\r\n']);
    })
  ));

  it('should wait for an async script to finish', () => (
    runScript('setTimeout(() => console.log("Async work"), 100)').then((sandbox) => {
      const { logEntries, duration } = sandbox;
      const logs = logEntries.map(({ msg }) => msg);
      expect(duration).toBeGreaterThan(100);
      expect(logs).toEqual(['Async work\r\n']);
    })
  ));
});
