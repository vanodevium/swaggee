const helpers = require('./helpers');

/**
 * Iterate through all method parameters and create array of parameter objects which are stored as path parameters
 * @param {{ type: String, parameter: { fields: { Parameter: Array }} }} verbs
 * @returns {Array}
 */
function createPathParameters(verbs) {
  const pathItemObject = [];
  if (verbs.parameter && verbs.parameter.fields.Parameter) {
    for (let i = 0; i < verbs.parameter.fields.Parameter.length; i++) {
      const param = verbs.parameter.fields.Parameter[i];
      const field = param.field;
      pathItemObject.push({
        name: field,
        in: 'path',
        required: !param.optional,
        schema: {
          type: param.type.toLowerCase(),
        },
        description: helpers.removeTags(param.description),
      });
    }
  }
  return pathItemObject;
}

/**
 * Iterate through all method parameters and create array of parameter objects which are stored as header parameters
 * @param {{ type: String, header: { fields: { Header: Array }} }} verbs
 * @returns {Array}
 */
function createHeaderParameters(verbs) {
  const headerItemObject = [];
  if (verbs.header && verbs.header.fields.Header) {
    for (let i = 0; i < verbs.header.fields.Header.length; i++) {
      const param = verbs.header.fields.Header[i];
      const field = param.field;
      headerItemObject.push({
        name: field,
        in: 'header',
        required: !param.optional,
        schema: {
          type: param.type.toLowerCase(),
        },
        description: helpers.removeTags(param.description),
      });
    }
  }
  return headerItemObject;
}

module.exports = {
  path: createPathParameters,
  header: createHeaderParameters,
};
