function parse(group) {
  if (!group.length) return null;

  return {
    group: group.replace(/(\s+)/g, '_'),
  };
}

/**
 * Exports
 */
module.exports = {
  parse: parse,
  path: 'local',
  method: 'insert',
};
