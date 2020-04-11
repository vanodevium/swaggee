import { parse as _parse, getGroup, method } from './api_param';

function parse(content, source) {
  return _parse(content, source, 'Header');
}

function path() {
  return 'local.header.fields.' + getGroup();
}

/**
 * Exports
 */
module.exports = {
  parse: parse,
  path: path,
  method: method,
  markdownFields: ['description'],
};
