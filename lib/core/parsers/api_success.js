import { parse as _parse, getGroup, method } from './api_param';

function parse(content, source) {
  return _parse(content, source, 'Success 200');
}

function path() {
  return 'local.success.fields.' + getGroup();
}

/**
 * Exports
 */
module.exports = {
  parse: parse,
  path: path,
  method: method,
  markdownFields: ['description', 'type'],
  markdownRemovePTags: ['type'],
};
