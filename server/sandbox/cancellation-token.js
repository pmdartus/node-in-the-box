// @flow

/**
 * Cancellation Token implementation for javascript
 * Based on: https://gist.github.com/danharper/ad6ca574184589dea28d
 */
class CancellationToken {
  reason: ?string
  _cancelled: boolean
  _subscribers: Function[]

  constructor() {
    this.reason = null;
    this._cancelled = false;
    this._subscribers = [];
  }

  isCanceled(): boolean {
    return this._cancelled;
  }

  cancel(reason: string = 'Cancelled') {
    if (this._cancelled) {
      throw new Error('Token has already been canceled');
    }

    this._cancelled = true;
    this.reason = reason;

    process.nextTick(() => {
      for (let subscriber of this._subscribers) {
        subscriber.call(null, reason);
      }
    });
  }

  subscribe<T: Function>(cb: T): T {
    if (this._cancelled) {
      process.nextTick(() => cb.call());
    }

    this._subscribers.push(cb);
    return cb;
  }
}

module.exports = CancellationToken;
