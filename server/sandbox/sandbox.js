// @flow

const path = require('path');
const EventEmitter = require('events');

type State =
  | 'PENDING'
  | 'RUNNING'
  | 'SUCCESS'
  | 'FAILED';

type EventName = 
  | 'stateChange'
  | 'log'

type LogEntry = {
  ts: string,
  msg: string,
}

const CODE_FILE_NAME = 'index.js';

class Sandbox {
  id: string
  content: string
  sandboxPath: string
  state: State
  startTs: ?Date
  duration: ?number
  logEntries: LogEntry[]
  _eventEmitter: EventEmitter

  constructor(
    id: string,
    sandboxPath: string,
    content: string,
  ) {
    this.id = id;
    this.content = content;
    this.sandboxPath = sandboxPath;

    this.state = 'PENDING';
    this.startTs = null;
    this.duration = 0;
    this.logEntries = [];
    this._eventEmitter = new EventEmitter();
  }

  setState(state: State) {
    const oldState = this.state;
    this.state = state;

    this._emit('stateChange', {
      state,
      oldState,
    });
  }

  log(ts: string, msg: string) {
    const payload = {
      ts,
      msg,
    };

    this.logEntries.push(payload);
    this._emit('log', payload);
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

  _emit(eventName: EventName, payload: Object) {
    this._eventEmitter.emit(eventName, {
      payload
    });
  }

  subsribe(
    eventName: EventName, 
    listener: (payload: Object) => any,
  ) {
    this._eventEmitter.addListener(eventName, listener);
  }
}

module.exports = Sandbox;
