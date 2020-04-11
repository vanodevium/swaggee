import { preProcess as _preProcess, postProcess as _postProcess } from './api_param_title';

// Additional information for error log
const _messages = {
  common: {
    element: 'apiError',
    usage: '@apiError (group) variableName',
    example: '@apiDefine MyValidErrorGroup Some title or 40X Error\n@apiError (MyValidErrorGroup) username',
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
  return _preProcess(parsedFiles, filenames, packageInfos, 'defineErrorTitle');
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
  _postProcess(parsedFiles, filenames, preProcess, packageInfos, 'defineErrorTitle', 'error', _messages);
}

/**
 * Exports
 */
module.exports = {
  preProcess,
  postProcess,
};
