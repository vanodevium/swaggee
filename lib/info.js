const _ = require('lodash');
const fs = require('fs');
const path = require('path');

let app = {};

class Info {
  constructor(_app) {
    // global variables
    app = _app;
  }

  /**
   * Read swaggee.json / package.json data
   */
  get() {
    let result = {};

    // Read package.json
    const packageJson = this._readPackageData('package.json');

    if (packageJson.apidoc) result = packageJson.apidoc;

    result = _.defaults({}, result, {
      name: packageJson.name || '',
      version: packageJson.version || '0.0.0',
      description: packageJson.description || '',
    });

    // read swaggee.json (and overwrite package.json information)
    const swaggeeJson = this._readPackageData('swaggee.json');

    // swaggee.json has higher priority
    _.extend(result, swaggeeJson);

    // options.packageInfo overwrites packageInfo
    _.extend(result, app.options.packageInfo);

    // replace header footer with file contents
    _.extend(result, this._getHeaderFooter(result));

    if (Object.keys(swaggeeJson).length === 0) app.log.warn('Please create an swaggee.json');

    return result;
  }

  /**
   * Read json data from source dir, or if it not exists from current dir.
   * Return the data merged with the default values.
   *
   * @param {String} filename
   * @returns {Object}
   */
  _readPackageData(filename) {
    let result = {};
    let jsonFilename = path.join(app.options.src, filename);

    // read from source dir
    if (!fs.existsSync(jsonFilename)) {
      // read vom current dir
      jsonFilename = './' + filename;
    }
    if (!fs.existsSync(jsonFilename)) {
      app.log.debug(filename + ' not found!');
    } else {
      try {
        result = JSON.parse(fs.readFileSync(jsonFilename, 'utf8'));
        app.log.debug('read: ' + jsonFilename);
      } catch (e) {
        throw new Error('Can not read: ' + filename + ', please check the format (e.g. missing comma)');
      }
    }
    return result;
  }

  /**
   * Get json.header / json.footer title and markdown content (from file)
   *
   * @param {Object} json
   * @returns {Object}
   */
  _getHeaderFooter(json) {
    const result = {};

    ['header', 'footer'].forEach(function(key) {
      if (json[key] && json[key].filename) {
        let filename = path.join(app.options.src, json[key].filename);
        if (!fs.existsSync(filename)) filename = path.join('./', json[key].filename);

        try {
          app.log.debug('read header file: ' + filename);
          const content = fs.readFileSync(filename, 'utf8');
          result[key] = {
            title: json[key].title,
            content: app.markdown ? app.markdown(content) : content,
          };
        } catch (e) {
          throw new Error('Can not read: ' + filename + '');
        }
      }
    });

    return result;
  }
}

/**
 * Exports
 */
module.exports = Info;
