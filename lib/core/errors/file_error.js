import { dirname } from 'path';

class FileError extends Error {
  constructor(message, file, path) {
    super();
    // enable stack trace
    Error.call(this);
    Error.captureStackTrace(this, this.constructor);
    this.name = this.constructor.name;
    this.message = message;
    this.file = file || '';
    this.path = path || file;
    if (this.path && this.path.charAt(this.path.length - 1) !== '/') {
      this.path = dirname(this.path);
    }
  }
}

/**
 * Exports
 */
export default FileError;
