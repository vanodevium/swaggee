function parse(name) {
  if (!name.length) return null;

  return {
    name: name.replace(/(\s+)/g, '_'),
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
