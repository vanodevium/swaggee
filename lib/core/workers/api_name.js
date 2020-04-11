const _ = require('lodash');

/**
 * PostProcess
 *
 * Priority: process after use and api
 *
 * @param {Object[]} parsedFiles
 */
function postProcess(parsedFiles) {
  const target = 'name';

  parsedFiles.forEach(function(parsedFile) {
    parsedFile.forEach(function(block) {
      // Ignore global name, or non existing global names (that will be generated with this func)
      // could overwrite local names on a later starting worker process from e.g. @apiUse
      if (Object.keys(block.global).length === 0) {
        let name = block.local[target];
        if (!name) {
          // TODO: Add a warning

          // HINT: document that name SHOULD always be used
          // if no name is set, the name will be generated from type and url.
          const type = block.local.type;
          const url = block.local.url;
          name = _.upperFirst(type);

          const matches = url.match(/[\w]+/g);
          if (matches) {
            for (let i = 0; i < matches.length; i += 1) {
              const part = matches[i];
              name += _.upperFirst(part);
            }
          }
        }

        // replace special chars
        name = name.replace(/[^\w]/g, '_');

        block.local[target] = name;
      }
    });
  });
}

/**
 * Exports
 */
module.exports = {
  postProcess,
};
