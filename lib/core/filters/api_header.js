import { postFilter as _postFilter } from './api_param.js';

/**
 * Post Filter parsed results.
 *
 * @param {Object[]} parsedFiles
 * @param {String[]} filenames
 */
function postFilter(parsedFiles, filenames) {
  _postFilter(parsedFiles, filenames, 'header');
}

/**
 * Exports
 */
export default postFilter;
