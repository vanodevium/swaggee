const { statSync } = require('fs-extra');
const klawSync = require('klaw-sync');
const os = require('os');
const { resolve } = require('path');

const FileError = require('../errors/file_error');

/**
 * Search files recursively and filter with include / exclude filters
 */
class FindFiles {
  constructor() {
    this.path = process.cwd();
    this.excludeFilters = [];
    this.includeFilters = [];
  }
  /**
   * Set path to source-files
   *
   * @param {String} newPath
   */
  setPath(newPath) {
    if (newPath) {
      this.path = resolve(newPath);
    }
  }
  /**
   * Set exclude filters
   *
   * @param {string[]} excludeFilters
   */
  setExcludeFilters(excludeFilters) {
    if (excludeFilters) {
      this.excludeFilters = excludeFilters;
    }
  }
  /**
   * Set include filters
   *
   * @param {string[]} includeFilters
   */
  setIncludeFilters(includeFilters) {
    if (includeFilters) {
      this.includeFilters = includeFilters;
    }
  }
  /**
   * Search files recursively and filter by include / exclude filters
   *
   * @returns {String[]}
   */
  search() {
    const self = this;
    let files = [];
    try {
      files = klawSync(self.path).map(function(entry) {
        return entry.path;
      });
      // create RegExp Include Filter List
      const regExpIncludeFilters = [];
      let filters = self.includeFilters;
      if (typeof filters === 'string') {
        filters = [filters];
      }
      filters.forEach(function(filter) {
        if (filter.length) {
          regExpIncludeFilters.push(new RegExp(filter));
        }
      });
      // RegExp Include Filter
      let length = regExpIncludeFilters.length;
      files = files.filter(function(filename) {
        // not include Directories like 'dirname.js/'
        if (statSync(filename).isDirectory()) {
          return 0;
        }
        if (os.platform() === 'win32') {
          filename = filename.replace(/\\/g, '/');
        }
        // apply every filter
        for (let i = 0; i < length; i += 1) {
          if (regExpIncludeFilters[i].test(filename)) {
            return 1;
          }
        }
        return 0;
      });
      // create RegExp Exclude Filter List
      const regExpExcludeFilters = [];
      filters = self.excludeFilters;
      if (typeof filters === 'string') {
        filters = [filters];
      }
      filters.forEach(function(filter) {
        if (filter.length > 0) {
          regExpExcludeFilters.push(new RegExp(filter));
        }
      });
      // RegExp Exclude Filter
      length = regExpExcludeFilters.length;
      files = files.filter(function(filename) {
        if (os.platform() === 'win32') {
          filename = filename.replace(/\\/g, '/');
        }
        // apply every filter
        for (let i = 0; i < length; i += 1) {
          if (regExpExcludeFilters[i].test(filename)) {
            return 0;
          }
        }
        return 1;
      });
    } catch (e) {
      throw e;
    } finally {
      if (!files || files.length === 0) {
        // noinspection ThrowInsideFinallyBlockJS
        throw new FileError('No files found.', self.path);
      }
      // remove source path prefix
      files = files.map(function(filename) {
        if (filename.startsWith(self.path)) {
          return filename.substr(self.path.length + 1);
        }
        return filename;
      });
    }
    return files;
  }
}

/**
 * Exports
 */
module.exports = new FindFiles();
