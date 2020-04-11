import { preProcess as _preProcess, postProcess as _postProcess } from './api_use';

// Additional information for error log
const _messages = {
  common: {
    element: 'apiHeaderStructure',
    usage: '@apiHeaderStructure group',
    example: '@apiDefine MyValidHeaderStructureGroup Some title\n@apiHeaderStructure MyValidHeaderStructureGroup',
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
  return _preProcess(parsedFiles, filenames, packageInfos, 'defineHeaderStructure');
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
  _postProcess(parsedFiles, filenames, preProcess, packageInfos, 'defineHeaderStructure', 'headerStructure', _messages);
}

/**
 * Exports
 */
module.exports = {
  preProcess,
  postProcess,
};
