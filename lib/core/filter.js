import { each, isObject } from 'lodash';

let app = {};

/**
 * Filter
 * Cleanup the data, e.g.: remove double fields, happen when overwrite a global inherited field with a local definition.
 *
 * @param {Object} _app
 */
class Filter {
  constructor(_app) {
    const self = this;
    // global variables
    app = _app;
    // class variables
    this.filters = {};
    // load filters
    const filters = Object.keys(app.filters);
    filters.forEach(function(filter) {
      if (isObject(app.filters[filter])) {
        app.log.debug('inject filter: ' + filter);
        self.addFilter(filter, app.filters[filter]);
      } else {
        const filename = app.filters[filter];
        app.log.debug('load filter: ' + filter + ', ' + filename);
        self.addFilter(filter, require(filename));
      }
    });
  }
  /**
   * Add Filter
   */
  addFilter(name, filter) {
    this.filters[name] = filter;
  }
  /**
   * Execute filter
   */
  process(parsedFiles, parsedFilenames) {
    // filter each @api-Parameter
    each(this.filters, function(filter, name) {
      if (filter.postFilter) {
        app.log.verbose('filter postFilter: ' + name);
        filter.postFilter(parsedFiles, parsedFilenames);
      }
    });
    // reduce to local blocks where global is empty
    const blocks = [];
    parsedFiles.forEach(function(parsedFile) {
      parsedFile.forEach(function(block) {
        if (Object.keys(block.global).length === 0 && Object.keys(block.local).length > 0) blocks.push(block.local);
      });
    });
    return blocks;
  }
}

/**
 * Exports
 */
module.exports = Filter;
