// @flow

const Sandbox = require('../sandbox');

describe('Sandbox', () => {
  it('constructor', () => {
    const sandbox = new Sandbox('123', '/tmp', 'return true;');
    expect(sandbox.id).toBe('123');
    expect(sandbox.sandboxPath).toBe('/tmp');
    expect(sandbox.content).toBe('return true;');
    expect(sandbox.state).toBe('PENDING');
  });

  it('advertises state change', () => {
    const sandbox = new Sandbox('123', '/tmp', 'return true;');
    const mockHandler = jest.fn();

    sandbox.subsribe('stateChange', mockHandler);
    sandbox.setState('RUNNING');

    expect(mockHandler).toBeCalledWith({
      payload: {
        state: 'RUNNING',
        oldState: 'PENDING',
      },
    });
  });

  it('advertise the logs', () => {
    const sandbox = new Sandbox('123', '/tmp', 'return true;');
    const mockHandler = jest.fn();

    sandbox.subsribe('log', mockHandler);
    sandbox.log('123', 'test log');

    expect(mockHandler).toBeCalledWith({
      payload: {
        ts: '123',
        msg: 'test log',
      },
    });
  });
});
