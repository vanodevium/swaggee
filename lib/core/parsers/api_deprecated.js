import unindent from '../utils/unindent';

function parse(deprecated) {
  if (deprecated.length) {
    return {
      deprecated: {
        content: unindent(deprecated),
      },
    };
  }

  return {
    deprecated: true,
  };
}

/**
 * Exports
 */
module.exports = {
  parse: parse,
  path: 'local',
  method: 'insert',
  markdownFields: ['deprecated.content'],
  markdownRemovePTags: ['deprecated.content'],
};
