class ParameterError extends Error {
  constructor(message, element, definition, example) {
    super();
    // enable stack trace
    Error.call(this);
    Error.captureStackTrace(this, this.constructor);
    this.name = this.constructor.name;
    this.message = message;
    this.element = element;
    this.definition = definition;
    this.example = example;
  }
}

/**
 * Exports
 */
export default ParameterError;
