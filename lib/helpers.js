const _ = require('lodash');

/**
 * @param {String} coreJson
 * @returns {*}
 */
const groupByUrl = function(coreJson) {
  return _.chain(coreJson)
    .groupBy('url')
    .toPairs()
    .map(function(element) {
      return _.zipObject(['url', 'verbs'], element);
    })
    .value();
};

/**
 * @param {String} text
 * @returns {String}
 */
function removeTags(text) {
  return text ? text.replace(/(<([^>]+)>)/gi, '') : text;
}

/**
 *
 * @param projectJson
 * @returns {{
 *     title: String,
 *     version: String,
 *     description: String,
 * }}
 */
function addInfo(projectJson) {
  const info = {};
  info.title = projectJson.title || projectJson.name;
  info.version = projectJson.version;
  info.description = projectJson.description;
  return info;
}

/**
 * @param {String} field
 * @returns {{propertyName: *, objectName: *}}
 */
function createNestedName(field) {
  let objectName;
  let propertyName = field;

  if (propertyName.includes(':')) {
    let split = propertyName.split(':');
    objectName = split[0];
    propertyName = split[1];
  }

  const propertyNames = propertyName.split('.');
  if (propertyNames && propertyNames.length > 1) {
    propertyName = propertyNames[propertyNames.length - 1];
    propertyNames.pop();
    objectName = objectName || propertyNames.join('.');
  }

  return {
    propertyName,
    objectName,
  };
}

module.exports = {
  groupByUrl,
  removeTags,
  addInfo,
  createNestedName,
};
