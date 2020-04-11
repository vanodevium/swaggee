import trim from '../utils/trim';
import unindent from '../utils/unindent';

function parse(content) {
  const description = trim(content);

  if (!description.length) return null;

  return {
    description: unindent(description),
  };
}

/**
 * Exports
 */
module.exports = {
  parse: parse,
  path: 'local',
  method: 'insert',
  markdownFields: ['description'],
};
