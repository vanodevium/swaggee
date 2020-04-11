const _ = require('lodash');
const pathToRegexp = require('path-to-regexp');
const helpers = require('./helpers');
const Definitions = require('./definitions');
const Parameters = require('./parameters');
const ResponseGenerator = require('./responses');

const swagger = {
  openapi: '3.0.2',
  info: {},
  paths: {},
  components: {
    schemas: {},
  },
};

function toSwagger(coreJson, projectJson) {
  swagger.info = helpers.addInfo(projectJson);
  swagger.paths = extractPaths(coreJson);
  return swagger;
}

/**
 * Extracts paths provided in json format
 * post, patch, put request parameters are extracted in body
 * get and delete are extracted to path parameters
 * @param coreJson
 * @returns {{}}
 */
function extractPaths(coreJson) {
  /**
   * @type {{ url: String, verbs: Array}[]}
   */
  const apiPaths = helpers.groupByUrl(coreJson);
  const paths = {};
  for (let i = 0; i < apiPaths.length; i++) {
    const verbs = apiPaths[i].verbs;
    let url = verbs[0].url;
    const pattern = pathToRegexp(url, null);
    const matches = pattern.exec(url);

    // Surrounds URL parameters with curly brackets -> :email with {email}
    const pathKeys = [];
    for (let j = 1; j < matches.length; j++) {
      const key = matches[j].substr(1);
      url = url.replace(matches[j], '{' + key + '}');
      pathKeys.push(key);
    }

    for (let j = 0; j < verbs.length; j++) {
      const verb = verbs[j];
      const type = verb.type;

      const obj = (paths[url] = paths[url] || {});

      const body = !['get', 'head', 'delete'].includes(type);
      _.extend(obj, createOutput(body, verb, swagger.components.schemas, pathKeys));
    }
  }
  return paths;
}

/**
 * @param {Boolean} body
 * @param {{
 *  type: String,
 *  header: {
 *    fields: {
 *      Header: Array
 *    },
 *  },
 *  parameter: {
 *    fields: {
 *      Parameter: Array
 *    },
 *  },
 *  error: {
 *    fields: {
 *      Error: Array
 *    },
 *  },
 * }} verb
 * @param {{}} definitions
 * @param {{}} pathKeys
 * @returns {{}}
 */
function createOutput(body, verb, definitions, pathKeys) {
  if (body) {
    return createBodyOutput(verb, definitions, pathKeys);
  }

  return createWithoutBodyOutput(verb, definitions, pathKeys);
}

/**
 * @param {{
 *  type: String,
 *  header: {
 *    fields: {
 *      Header: Array,
 *    }
 *  },
 *  parameter: {
 *    fields: {
 *      Parameter: Array,
 *    }
 *  },
 *  error: {
 *    fields: {
 *      Error: Array,
 *    }
 *  }
 * }} verbs
 * @param {{}} definitions
 * @param {{}} pathKeys
 * @returns {{}}
 */
function createBodyOutput(verbs, definitions, pathKeys) {
  verbs.type = verbs.type === 'del' ? 'delete' : verbs.type;
  const pathItemObject = {};

  let params = [];

  let pathParams = Parameters.path(verbs);
  pathParams = _.filter(pathParams, function(param) {
    const hasKey = pathKeys.indexOf(param.name) !== -1;
    return !(param.in === 'path' && !hasKey);
  });
  params = params.concat(pathParams);

  const createDefinitionsResult = createDefinitions(verbs, definitions, params);

  params = params.concat(Parameters.header(verbs));

  ResponseGenerator.parameters(pathItemObject, verbs, params);

  if (
    createDefinitionsResult.fieldsTypeKeys.includes(Definitions.FIELDS_REQUEST + _.upperFirst(verbs.type)) &&
    createDefinitionsResult.topLevelParametersRef
  ) {
    const required =
      verbs.parameter &&
      verbs.parameter.fields &&
      verbs.parameter.fields.Parameter &&
      verbs.parameter.fields.Parameter.length > 0;

    pathItemObject[verbs.type].requestBody = {
      description: `${createDefinitionsResult.topLevelParametersRef} request`,
      required: required,
      content: {
        'application/json': {
          schema: {
            $ref: '#/components/schemas/Request' + createDefinitionsResult.topLevelParametersRef,
          },
        },
      },
    };
  }

  if (createDefinitionsResult.topLevelSuccessRef) {
    ResponseGenerator.success(pathItemObject, verbs, createDefinitionsResult);
  }

  if (createDefinitionsResult.topLevelErrorRef) {
    ResponseGenerator.error(pathItemObject, verbs, createDefinitionsResult);
  }

  return pathItemObject;
}

/**
 * @param verbs
 * @param definitions
 * @param pathKeys
 * @returns {{}}
 */
function createWithoutBodyOutput(verbs, definitions, pathKeys) {
  const pathItemObject = {};

  let params = [];

  let pathParams = Parameters.path(verbs);
  pathParams = _.filter(pathParams, function(param) {
    const hasKey = pathKeys.indexOf(param.name) !== -1;
    return !(param.in === 'path' && !hasKey);
  });
  params = params.concat(pathParams);

  params = params.concat(Parameters.header(verbs));
  ResponseGenerator.parameters(pathItemObject, verbs, params);

  const verbDefinitionResult = createDefinitions(verbs, definitions, params);

  if (verbDefinitionResult.topLevelSuccessRef) {
    ResponseGenerator.success(pathItemObject, verbs, verbDefinitionResult);
  }

  if (verbDefinitionResult.topLevelErrorRef) {
    ResponseGenerator.error(pathItemObject, verbs, verbDefinitionResult);
  }

  return pathItemObject;
}

/**
 * @param verbs
 * @param definitions
 * @param params
 * @returns {{
 *   topLevelParametersRef,
 *   topLevelSuccessRef,
 *   topLevelSuccessRefType,
 *   topLevelErrorRef,
 *   topLevelErrorRefType,
 *   definitions: Array,
 *   fieldsTypeKeys: Array,
 * }}
 */
function createDefinitions(verbs, definitions, params) {
  const result = {
    topLevelParametersRef: null,
    topLevelSuccessRef: null,
    topLevelSuccessRefType: null,
    topLevelErrorRef: null,
    topLevelErrorRefType: null,
    definitions: [],
    fieldsTypeKeys: [],
  };

  let fieldArrayResult;
  if (verbs && verbs.parameter && verbs.parameter.fields) {
    fieldArrayResult = Definitions.fields(
      Definitions.FIELDS_REQUEST,
      verbs.parameter.fields.Parameter,
      definitions,
      verbs,
      params
    );
    result.topLevelParametersRef = fieldArrayResult.topLevelRef;
    result.fieldsTypeKeys = result.fieldsTypeKeys.concat(Array.from(fieldArrayResult.fieldsTypeKeys));
  }

  if (verbs && verbs.success && verbs.success.fields) {
    fieldArrayResult = Definitions.fields(
      Definitions.FIELDS_RESPONSE,
      verbs.success.fields['Success 200'],
      definitions,
      verbs,
      params
    );
    result.topLevelSuccessRef = fieldArrayResult.topLevelRef;
    result.topLevelSuccessRefType = fieldArrayResult.topLevelRefType;
    result.fieldsTypeKeys = result.fieldsTypeKeys.concat(Array.from(fieldArrayResult.fieldsTypeKeys));
  }

  if (verbs && verbs.error && verbs.error.fields) {
    fieldArrayResult = Definitions.fields(
      Definitions.FIELDS_ERROR,
      verbs.error.fields['Error 4xx'],
      definitions,
      verbs,
      params
    );
    result.topLevelErrorRef = fieldArrayResult.topLevelRef;
    result.topLevelErrorRefType = fieldArrayResult.topLevelRefType;
    result.fieldsTypeKeys = result.fieldsTypeKeys.concat(Array.from(fieldArrayResult.fieldsTypeKeys));
  }

  return result;
}

module.exports = {
  toSwagger: toSwagger,
};
