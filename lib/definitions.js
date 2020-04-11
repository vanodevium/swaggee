const _ = require('lodash');
const helpers = require('./helpers');

const FIELDS_REQUEST = 'Request';
const FIELDS_RESPONSE = 'Response';
const FIELDS_ERROR = 'Error';

const FORMAT_INT32 = 'int32';
const FORMAT_INT64 = 'int64';
const FORMAT_FLOAT = 'float';
const FORMAT_DOUBLE = 'double';
const FORMAT_BYTE = 'byte';
const FORMAT_BINARY = 'binary';
const FORMAT_DATE = 'date';
const FORMAT_DATETIME = 'datetime';
const FORMAT_DATE_TIME = 'date-time';
const FORMAT_PASSWORD = 'password';

const FORMATS = [
  FORMAT_INT32,
  FORMAT_INT64,
  FORMAT_FLOAT,
  FORMAT_DOUBLE,
  FORMAT_BYTE,
  FORMAT_BINARY,
  FORMAT_DATE,
  FORMAT_DATETIME,
  FORMAT_DATE_TIME,
  FORMAT_PASSWORD,
];

const TYPE_STRING = 'string';
const TYPE_NUMBER = 'number';
const TYPE_INTEGER = 'integer';
const TYPE_BOOLEAN = 'boolean';
const TYPE_ARRAY = 'array';
const TYPE_FILE = 'file';
const TYPE_REF = '$ref';
const TYPE_OBJECT = 'object';

const TYPES = [TYPE_STRING, TYPE_NUMBER, TYPE_INTEGER, TYPE_BOOLEAN, TYPE_ARRAY, TYPE_FILE, TYPE_REF, TYPE_OBJECT];

const TYPES_FORMATS = {
  [TYPE_INTEGER]: [FORMAT_INT32, FORMAT_INT64],
  [TYPE_NUMBER]: [FORMAT_FLOAT, FORMAT_DOUBLE],
  [TYPE_STRING]: [FORMAT_BYTE, FORMAT_BINARY, FORMAT_PASSWORD, FORMAT_DATE, FORMAT_DATETIME, FORMAT_DATE_TIME],
};

/**
 * @param fieldsType
 * @param fieldArray
 * @param definitions
 * @param {{
 *   name: String,
 *   type: String,
 *   description: String,
 * }} verb
 * @param params
 * @returns {{
 *   topLevelRef: *,
 *   topLevelRefType: *,
 *   fieldsTypeKeys: Set,
 *   localDefinitions: {},
 *   definitions: {},
 * }}
 */
function fields(fieldsType, fieldArray, definitions, verb, params) {
  const result = {
    topLevelRef: verb.name,
    topLevelRefType: null,
    fieldsTypeKeys: new Set(),
    localDefinitions: {},
    definitions: {},
  };

  if (!fieldArray) {
    return result;
  }

  result.fieldsTypeKeys.add(fieldsType + _.upperFirst(verb.type));

  const pathParams = _.map(
    _.filter(params, function(el) {
      return el.in === 'path';
    }),
    el => el.name
  );

  const withoutBody = ['get', 'head', 'delete'].includes(verb.type);

  _.forEach(fieldArray, function(parameter, i) {
    if (FIELDS_REQUEST === fieldsType && (pathParams.includes(parameter.field) || withoutBody)) {
      return;
    }

    const nestedName = helpers.createNestedName(parameter.field);
    let objectName = nestedName.objectName;
    if (!objectName) {
      objectName = verb.name;
    }

    const type = parameter.type;

    if (0 === i) {
      if (fieldsType === FIELDS_RESPONSE || fieldsType === FIELDS_ERROR) {
        result.topLevelRefType = TYPE_OBJECT;
      } else {
        result.topLevelRefType = type.toLowerCase();
      }
      // noinspection FallThroughInSwitchStatementJS
      switch (type) {
        case TYPE_ARRAY:
          result.topLevelRefType = TYPE_ARRAY;
        case TYPE_OBJECT:
          objectName = nestedName.propertyName;
          nestedName.propertyName = null;
          break;
        default:
          break;
      }
      result.topLevelRef = objectName;
    }

    const definitionKey = fieldsType + _.upperFirst(objectName);

    if (!definitions[definitionKey]) {
      definitions[definitionKey] = { properties: {}, required: [] };
    }

    if (!result.localDefinitions[definitionKey]) {
      result.localDefinitions[definitionKey] = { properties: {}, required: [] };
    }

    if (nestedName.propertyName) {
      const prop = {
        type: _.toString(parameter.type).toLowerCase(),
        description: helpers.removeTags(parameter.description),
      };

      arrayOf(prop, type, fieldsType);

      arrayTypeMustHaveItemsProperty(prop);

      filters(prop);

      defaultValue(prop, parameter);

      allowedValues(prop, parameter);

      refIfObject(prop, parameter, fieldsType);

      validateType(prop);

      definitions[definitionKey].properties[nestedName.propertyName] = prop;
      result.localDefinitions[definitionKey].properties[nestedName.propertyName] = prop;

      if (!parameter.optional) {
        const required = definitions[definitionKey].required;
        if (!required.includes(nestedName.propertyName)) {
          required.push(nestedName.propertyName);
        }

        const localRequired = result.localDefinitions[definitionKey].required;
        if (!localRequired.includes(nestedName.propertyName)) {
          localRequired.push(nestedName.propertyName);
        }
      }
    }

    if (!definitions[definitionKey].required.length) {
      delete definitions[definitionKey].required;
    }

    if (!result.localDefinitions[definitionKey].required.length) {
      delete result.localDefinitions[definitionKey].required;
    }
  });

  return result;
}

function refIfObject(prop, parameter, fieldsType) {
  if (prop.type === TYPE_OBJECT) {
    prop.$ref = `#/components/schemas/${fieldsType}${_.upperFirst(parameter.field)}`;
    delete prop.type;
    delete prop.description;
  }
}

function validateType(prop) {
  if (prop.type && !TYPES.includes(prop.type)) {
    prop.type = TYPE_STRING;
  }
}

function allowedValues(prop, parameter) {
  if (parameter.allowedValues) {
    prop.enum = parameter.allowedValues;
    if (!prop.default || !prop.enum.includes(prop.default)) {
      prop.default = prop.enum[0];
    }
  }
}

function defaultValue(prop, parameter) {
  if (parameter.defaultValue) {
    prop.default = parameter.defaultValue;
  }
}

function arrayOf(prop, type, fieldsType) {
  if (/\[]$/.test(type)) {
    prop.type = TYPE_ARRAY;

    let t = type.replace(/\[]$/, '').toLowerCase() || TYPE_STRING;
    if (/^\$/.test(t)) {
      t = t.replace(/^\$/, '');
      prop.items = {
        $ref: '#/components/schemas/' + fieldsType + _.upperFirst(t),
      };
    } else {
      prop.items = {
        type: t,
      };
    }
  }
}

function filters(prop) {
  if (prop.type.includes('|')) {
    let split = prop.type.split('|');
    prop.type = split[0];
    if (FORMATS.includes(split[1]) && TYPES_FORMATS[prop.type] && TYPES_FORMATS[prop.type].includes(split[1])) {
      prop.format = FORMAT_DATETIME === split[1] ? FORMAT_DATE_TIME : split[1];
    }
  }
}

function arrayTypeMustHaveItemsProperty(prop) {
  if (prop.type === TYPE_ARRAY && !prop.items) {
    prop.items = {
      type: TYPE_STRING,
    };
  }
}

module.exports = {
  FIELDS_REQUEST,
  FIELDS_RESPONSE,
  FIELDS_ERROR,
  fields,
};
