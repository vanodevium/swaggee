import { preProcess as _preProcess, postProcess as _postProcess } from './api_use';

// Additional information for error log
const _messages = {
  common: {
    element: 'apiSuccessStructure',
    usage: '@apiSuccessStructure group',
    example: '@apiDefine MyValidSuccessStructureGroup Some title\n@apiSuccessStructure MyValidSuccessStructureGroup',
  },
};

/**
 * PreProcess
 *
 * @param {Object[]} parsedFiles
 * @param {String[]} filenames
 * @param {Object}   packageInfos
 * @returns {Object}
 */
function preProcess(parsedFiles, filenames, packageInfos) {
  return _preProcess(parsedFiles, filenames, packageInfos, 'defineSuccessStructure');
}

/**
 * PostProcess
 *
 * @param {Object[]} parsedFiles
 * @param {String[]} filenames
 * @param {Object[]} preProcess
 * @param {Object}   packageInfos
 */
function postProcess(parsedFiles, filenames, preProcess, packageInfos) {
  _postProcess(
    parsedFiles,
    filenames,
    preProcess,
    packageInfos,
    'defineSuccessStructure',
    'successStructure',
    _messages
  );
}

/**
 * Exports
 */
module.exports = {
  preProcess,
  postProcess,
};
