const helpers = require('./helpers');

function initResponses(pathItemObject, verbs) {
  if (!pathItemObject[verbs.type].responses) {
    pathItemObject[verbs.type].responses = {};
  }
}

function generateSuccessResponses(pathItemObject, verbs, verbDefinitionResult) {
  initResponses(pathItemObject, verbs);

  pathItemObject[verbs.type].responses['200'] = {
    description: 'Successful response',
    content: {
      'application/json': {
        schema: {
          $ref: '#/components/schemas/Response' + verbDefinitionResult.topLevelSuccessRef,
        },
      },
    },
  };
}

function generateErrorResponses(pathItemObject, verbs, verbDefinitionResult) {
  initResponses(pathItemObject, verbs);

  pathItemObject[verbs.type].responses['404'] = {
    description: 'Error response',
    content: {
      'application/json': {
        schema: {
          $ref: '#/components/schemas/Error' + verbDefinitionResult.topLevelErrorRef,
        },
      },
    },
  };
}

function generateParameters(pathItemObject, verbs, params) {
  pathItemObject[verbs.type] = {
    tags: [verbs.group],
    summary: helpers.removeTags(verbs.description),
    parameters: params,
  };
}

module.exports = {
  parameters: generateParameters,
  success: generateSuccessResponses,
  error: generateErrorResponses,
};
