import { preProcess as _preProcess, postProcess as _postProcess } from './api_param_title';

// Additional information for error log
const _messages = {
  common: {
    element: 'apiHeader',
    usage: '@apiHeader (group) variableName',
    example: '@apiDefine MyValidHeaderGroup Some title\n@apiHeader (MyValidHeaderGroup) Content-Type',
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
  return _preProcess(parsedFiles, filenames, packageInfos, 'defineHeaderTitle');
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
  _postProcess(parsedFiles, filenames, preProcess, packageInfos, 'defineHeaderTitle', 'header', _messages);
}

/**
 * Exports
 */
module.exports = {
  preProcess,
  postProcess,
};
