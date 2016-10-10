const path = require('path');

const Manager = require('../manager');
const Sandbox = require('../sandbox');
const config = require('../../config');

const SANDBOXES_PATH = path.resolve(__dirname, '../../../sandboxes-test');

function createManager(dockerConfig = config.dockerConfig) {
  const manager = new Manager(SANDBOXES_PATH);
  return manager.init(dockerConfig)
    .then(() => manager);
}

function runScript(content, runConfig) {
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

  it('creates and init a manager using docker config', () => (
    createManager({})
      .catch(err => expect(err).not.toBeNull)
  ));

  it('thorws when creating a sandbox before init', () => {
    const manager = new Manager();
    return expect(() => manager.createSandboxe('return true;'))
      .toThrowError(/init/);
  });

  it('creates sandbox return a new Sandbox instance', () => (
    createManager().then((manager) => {
      const sandbox = manager.createSandboxe('');
      expect(sandbox instanceof Sandbox);
    })
  ));
});

describe('Execution', () => {
  it('executes simple script error', () => (
    runScript('return true;')
  ));

  it('sets sandbox state and complementary info', () => (
    runScript('return true;').then((sandbox) => {
      expect(sandbox.state).toBe('SUCCESS');
      expect(sandbox.duration).toBeGreaterThan(0);
      expect(sandbox.startTs).not.toBeNull();
    })
  ));
});
