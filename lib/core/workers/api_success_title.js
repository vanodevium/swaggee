import { preProcess as _preProcess, postProcess as _postProcess } from './api_param_title';

// Additional information for error log
const _messages = {
  common: {
    element: 'apiSuccess',
    usage: '@apiSuccess (group) variableName',
    example: '@apiDefine MyValidSuccessGroup Some title or 200 OK\n@apiSuccess (MyValidSuccessGroup) username',
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
  return _preProcess(parsedFiles, filenames, packageInfos, 'defineSuccessTitle');
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
  _postProcess(parsedFiles, filenames, preProcess, packageInfos, 'defineSuccessTitle', 'success', _messages);
}

/**
 * Exports
 */
module.exports = {
  preProcess,
  postProcess,
};
