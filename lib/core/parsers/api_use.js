function parse(name) {
  if (!name.length) return null;

  return {
    name: name,
  };
}

/**
 * Exports
 */
module.exports = {
  parse: parse,
  path: 'local.use',
  method: 'push',
  preventGlobal: true,
};
