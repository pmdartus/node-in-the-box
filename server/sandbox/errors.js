// @flow

/**
 * Extensible Error es6 Class
 * Based on http://stackoverflow.com/questions/31089801/extending-error-in-javascript-with-es6-syntax
 */
class ExtensibleError extends Error {
  constructor(message: string) {
    super();
    this.message = message;
    this.name = this.constructor.name;

    if (typeof Error.captureStackTrace === 'function') {
      Error.captureStackTrace(this, this.constructor);
    } else {
      this.stack = (new Error(message)).stack;
    }
  }
}

class DockerConnectionError extends ExtensibleError {
  response: Object

  constructor(apiResponse: Object) {
    super('Error while connecting to Docker API');
    this.response = apiResponse;
  }
}

module.exports = {
  DockerConnectionError,
};
