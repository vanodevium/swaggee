import { valid } from 'semver';

import ParameterError from '../errors/parameter_error';

function parse(content) {
  if (!content.length) return null;

  if (!valid(content))
    throw new ParameterError(
      'Version format not valid.',
      'apiVersion',
      '@apiVersion major.minor.patch',
      '@apiVersion 1.2.3'
    );

  return {
    version: content,
  };
}

/**
 * Exports
 */
module.exports = {
  parse: parse,
  path: 'local',
  method: 'insert',
  extendRoot: true,
};
