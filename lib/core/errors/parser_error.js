class ParserError extends Error {
  constructor(message, file, block, element, source, extra) {
    super();
    // enable stack trace
    Error.call(this);
    Error.captureStackTrace(this, this.constructor);
    this.name = this.constructor.name;
    this.message = message;
    this.file = file;
    this.block = block;
    this.element = element;
    this.source = source;
    this.extra = extra || [];
  }
}

/**
 * Exports
 */
export default ParserError;
