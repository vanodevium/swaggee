function parse(url) {
  if (!url.length) return null;

  return {
    url: url,
  };
}

/**
 * Exports
 */
module.exports = {
  parse: parse,
  path: 'local.sampleRequest',
  method: 'push',
};
