import { resolve } from 'path';
import { gte } from 'semver';
import WorkerError from '../errors/worker_error';

// Additional information for error log
const _messages = {
  common: {
    element: 'apiGroup',
    usage: '@apiGroup group',
    example: '@apiDefine MyValidGroup Some title\n@apiGroup MyValidGroup',
  },
};

/**
 * PreProcess
 *
 * @param {Object[]} parsedFiles
 * @param {String[]} filenames
 * @param {Object}   packageInfos
 * @param {String}   target       Target path in preProcess-Object (returned result), where the data should be set.
 * @returns {Object}
 */
function preProcess(parsedFiles, filenames, packageInfos, target) {
  target = target || 'defineGroup';
  const source = 'define'; // relative path to the tree (global.), from where the data should be fetched.

  const result = {};
  result[target] = {};

  parsedFiles.forEach(function(parsedFile) {
    parsedFile.forEach(function(block) {
      if (block.global[source]) {
        const name = block.global[source].name;
        const version = block.version || packageInfos.defaultVersion;

        if (!result[target][name]) result[target][name] = {};

        // fetch from global
        result[target][name][version] = block.global[source];
      }
    });
  });

  // remove empty target
  if (0 === result[target].length) delete result[target];

  return result;
}

/**
 * PostProcess
 *
 * @param {Object[]} parsedFiles
 * @param {String[]} filenames
 * @param {Object[]} preProcess
 * @param {Object}   packageInfos
 * @param {String}   source       Source path in preProcess-Object
 * @param {String}   target       Relative path to the tree (local.), where the data should be modified.
 * @param {{}}   messages
 */
function postProcess(parsedFiles, filenames, preProcess, packageInfos, source, target, messages) {
  source = source || 'defineGroup';
  target = target || 'group';
  messages = messages || _messages;

  // set group name if empty
  parsedFiles.forEach(function(parsedFile, parsedFileIndex) {
    parsedFile.forEach(function(block) {
      // Ignore global groups, or non existing global group names (that will be generated with this func)
      // could overwrite local names on a later starting worker process from e.g. @apiUse
      if (Object.keys(block.global).length === 0) {
        let group = block.local[target];
        if (!group) {
          // TODO: Add a warning

          // if no group is set, the filename will be the group-name
          group = resolve(filenames[parsedFileIndex]);
        }

        // replace special chars
        group = group.replace(/[^\w]/g, '_');

        block.local[target] = group;
      }
    });
  });

  // add group description and title
  parsedFiles.forEach(function(parsedFile, parsedFileIndex) {
    parsedFile.forEach(function(block) {
      if (!block.local[target]) return;

      const name = block.local[target];
      const version = block.version || packageInfos.defaultVersion;
      let matchedData = {};

      if (!preProcess[source] || !preProcess[source][name]) {
        // TODO: Enable in the next version
        // At the moment the (groupname) is optional and must not be defined.
        /*
                                var extra = [
                                    { 'Groupname': name }
                                ];
                                throw new WorkerError('Referenced groupname does not exist / it is not defined with @apiDefine.',
                                                      filenames[parsedFileIndex],
                                                      block.index,
                                                      messages.common.element,
                                                      messages.common.usage,
                                                      messages.common.example,
                                                      extra);
                */
        // TODO: Remove in the next version
        matchedData.title = block.local[target];
        matchedData.description = undefined;
      }

      // TODO: Remove in the next version
      else {
        if (preProcess[source][name][version]) {
          // found the version
          matchedData = preProcess[source][name][version];
        } else {
          // find nearest matching version
          let foundIndex = -1;
          let lastVersion = packageInfos.defaultVersion;

          const versionKeys = Object.keys(preProcess[source][name]);
          versionKeys.forEach(function(currentVersion, versionIndex) {
            if (gte(version, currentVersion) && gte(currentVersion, lastVersion)) {
              lastVersion = currentVersion;
              foundIndex = versionIndex;
            }
          });

          if (foundIndex === -1) {
            const extra = [{ Groupname: name }, { Version: version }, { 'Defined versions': versionKeys }];
            throw new WorkerError(
              'Referenced definition has no matching or a higher version. ' +
                'Check version number in referenced define block.',
              filenames[parsedFileIndex],
              block.index,
              messages.common.element,
              messages.common.usage,
              messages.common.example,
              extra
            );
          }

          const versionName = versionKeys[foundIndex];
          matchedData = preProcess[source][name][versionName];
        }

        // TODO: Remove in the next version
      }

      block.local.groupTitle = matchedData.title;

      if (matchedData.description) block.local.groupDescription = matchedData.description; // keep original block.local
    });
  });
}

/**
 * Exports
 */
module.exports = {
  preProcess,
  postProcess,
};
