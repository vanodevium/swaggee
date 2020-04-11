const _ = require('lodash');
const iconv = require('iconv-lite');
import { readFileSync } from 'fs';
import { extname } from 'path';

import findFiles from './utils/find_files';
import ParameterError from './errors/parameter_error';
import ParserError from './errors/parser_error';

let app = {};

class Parser {
  constructor(_app) {
    const self = this;
    // global variables
    app = _app;
    // class variables
    self.languages = {};
    self.parsers = {};
    self.parsedFileElements = [];
    self.parsedFiles = [];
    self.countDeprecated = {};
    // load languages
    const languages = Object.keys(app.languages);
    languages.forEach(function(language) {
      if (_.isObject(app.languages[language])) {
        app.log.debug('inject parser language: ' + language);
        self.addLanguage(language, app.languages[language]);
      } else {
        const filename = app.languages[language];
        app.log.debug('load parser language: ' + language + ', ' + filename);
        self.addLanguage(language, require(filename));
      }
    });
    // load parser
    const parsers = Object.keys(app.parsers);
    parsers.forEach(function(parser) {
      if (_.isObject(app.parsers[parser])) {
        app.log.debug('inject parser: ' + parser);
        self.addParser(parser, app.parsers[parser]);
      } else {
        const filename = app.parsers[parser];
        app.log.debug('load parser: ' + parser + ', ' + filename);
        self.addParser(parser, require(filename));
      }
    });
  }
  /**
   * Add a Language
   */
  addLanguage(name, language) {
    this.languages[name] = language;
  }
  /**
   * Add a Parser
   */
  addParser(name, parser) {
    this.parsers[name] = parser;
  }
  /**
   * Parse files in specified folder
   *
   * @param {Object} options The options used to parse and filder the files.
   * @param {Object[]} parsedFiles List of parsed files.
   * @param {String[]} parsedFilenames List of parsed files, with full path.
   */
  parseFiles(options, parsedFiles, parsedFilenames) {
    const self = this;
    findFiles.setPath(options.src);
    findFiles.setExcludeFilters(options.excludeFilters);
    findFiles.setIncludeFilters(options.includeFilters);
    const files = findFiles.search();
    // Parser
    for (let i = 0; i < files.length; i += 1) {
      const filename = options.src + files[i];
      const parsedFile = self.parseFile(filename, options.encoding);
      if (parsedFile) {
        app.log.verbose('parse file: ' + filename);
        parsedFiles.push(parsedFile);
        parsedFilenames.push(filename);
      }
    }
  }
  /**
   * Execute Fileparsing
   */
  parseFile(filename, encoding) {
    const self = this;
    if (typeof encoding === 'undefined') encoding = 'utf8';
    app.log.debug('inspect file: ' + filename);
    self.filename = filename;
    self.extension = extname(filename).toLowerCase();
    // TODO: Not sure if this is correct. Without skipDecodeWarning we got string errors
    // https://github.com/apidoc/apidoc-core/pull/25
    const fileContent = readFileSync(filename, { encoding: 'binary' });
    iconv.skipDecodeWarning = true;
    self.src = iconv.decode(fileContent, encoding);
    app.log.debug('size: ' + self.src.length);
    // unify line-breaks
    self.src = self.src.replace(/\r\n/g, '\n');
    self.blocks = [];
    self.indexApiBlocks = [];
    // determine blocks
    self.blocks = self._findBlocks();
    if (self.blocks.length === 0) return;
    app.log.debug('count blocks: ' + self.blocks.length);
    // determine elements in blocks
    self.elements = self.blocks.map(function(block, i) {
      const elements = self.findElements(block, filename);
      app.log.debug('count elements in block ' + i + ': ' + elements.length);
      return elements;
    });
    if (self.elements.length === 0) return;
    // determine list of blocks with API elements
    self.indexApiBlocks = self._findBlockWithApiGetIndex(self.elements);
    if (self.indexApiBlocks.length === 0) return;
    return self._parseBlockElements(self.indexApiBlocks, self.elements, filename);
  }
  /**
   * Parse API Elements with Plugins
   *
   * @param indexApiBlocks
   * @param detectedElements
   * @param {String} filename
   * @returns {Array}
   */
  _parseBlockElements(indexApiBlocks, detectedElements, filename) {
    const self = this;
    const parsedBlocks = [];
    for (let i = 0; i < indexApiBlocks.length; i += 1) {
      const blockIndex = indexApiBlocks[i];
      const elements = detectedElements[blockIndex];
      const blockData = {
        global: {},
        local: {},
      };
      let countAllowedMultiple = 0;
      for (let j = 0; j < elements.length; j += 1) {
        const element = elements[j];
        const elementParser = self.parsers[element.name];
        if (!elementParser) {
          app.log.warn("parser plugin '" + element.name + "' not found in block: " + blockIndex);
        } else {
          app.log.debug('found @' + element.sourceName + ' in block: ' + blockIndex);
          // Deprecation warning
          if (elementParser.deprecated) {
            self.countDeprecated[element.sourceName] = self.countDeprecated[element.sourceName]
              ? self.countDeprecated[element.sourceName] + 1
              : 1;
            let message = '@' + element.sourceName + ' is deprecated';
            if (elementParser.alternative)
              message = '@' + element.sourceName + ' is deprecated, please use ' + elementParser.alternative;
            if (self.countDeprecated[element.sourceName] === 1)
              // show deprecated message only 1 time as warning
              app.log.warn(message);
            // show deprecated message more than 1 time as verbose message
            else app.log.verbose(message);
            app.log.verbose('in file: ' + filename + ', block: ' + blockIndex);
          }
          let values;
          let preventGlobal;
          let allowMultiple;
          let pathTo;
          let attachMethod;
          try {
            // parse element and retrieve values
            values = elementParser.parse(element.content ? element.content.trim() : element.content, element.source);
            // HINT: pathTo MUST be read after elementParser.parse, because of dynamic paths
            // Add all other options after parse too, in case of a custom plugin need to modify params.
            // check if it is allowed to add to global namespace
            preventGlobal = elementParser.preventGlobal === true;
            // allow multiple inserts into pathTo
            allowMultiple = elementParser.allowMultiple === true;
            // path to an array, where the values should be attached
            pathTo = '';
            if (elementParser.path) {
              if (typeof elementParser.path === 'string') pathTo = elementParser.path;
              else pathTo = elementParser.path(); // for dynamic paths
            }
            if (!pathTo) throw new ParserError('pathTo is not defined in the parser file.', '', '', element.sourceName);
            // method how the values should be attached (insert or push)
            attachMethod = elementParser.method || 'push';
            if (attachMethod !== 'insert' && attachMethod !== 'push')
              throw new ParserError(
                'Only push or insert are allowed parser method values.',
                '',
                '',
                element.sourceName
              );
            // TODO: put this into "converters"
            if (values) {
              // Markdown.
              if (app.markdownParser && elementParser.markdownFields && elementParser.markdownFields.length > 0) {
                for (let markdownIndex = 0; markdownIndex < elementParser.markdownFields.length; markdownIndex += 1) {
                  const field = elementParser.markdownFields[markdownIndex];
                  let value = _.get(values, field);
                  if (value) {
                    value = app.markdownParser.render(value);
                    // remove line breaks
                    value = value.replace(/(\r\n|\n|\r)/g, ' ');
                    value = value.trim();
                    _.set(values, field, value);
                    // TODO: Little hacky, not sure to handle this here or in template
                    if (
                      elementParser.markdownRemovePTags &&
                      elementParser.markdownRemovePTags.length > 0 &&
                      elementParser.markdownRemovePTags.indexOf(field) !== -1
                    ) {
                      // Remove p-Tags
                      value = value.replace(/(<p>|<\/p>)/g, '');
                      _.set(values, field, value);
                    }
                  }
                }
              }
            }
          } catch (e) {
            if (e instanceof ParameterError) {
              const extra = [];
              if (e.definition) extra.push({ Definition: e.definition });
              if (e.example) extra.push({ Example: e.example });
              throw new ParserError(
                e.message,
                self.filename,
                blockIndex + 1,
                element.sourceName,
                element.source,
                extra
              );
            }
            throw new ParserError(
              'Undefined error.',
              self.filename,
              blockIndex + 1,
              element.sourceName,
              element.source
            );
          }
          if (!values)
            throw new ParserError(
              'Empty parser result.',
              self.filename,
              blockIndex + 1,
              element.sourceName,
              element.source
            );
          if (preventGlobal) {
            // Check if count global namespace entries > count allowed
            // (e.g. @successTitle is global, but should co-exist with @apiErrorStructure)
            if (Object.keys(blockData.global).length > countAllowedMultiple)
              throw new ParserError(
                'Only one definition or usage is allowed in the same block.',
                self.filename,
                blockIndex + 1,
                element.sourceName,
                element.source
              );
          }
          // only one global allowed per block
          if (pathTo === 'global' || pathTo.substr(0, 7) === 'global.') {
            if (allowMultiple) {
              countAllowedMultiple += 1;
            } else {
              if (Object.keys(blockData.global).length > 0)
                throw new ParserError(
                  'Only one definition is allowed in the same block.',
                  self.filename,
                  blockIndex + 1,
                  element.sourceName,
                  element.source
                );
              if (preventGlobal === true)
                throw new ParserError(
                  'Only one definition or usage is allowed in the same block.',
                  self.filename,
                  blockIndex + 1,
                  element.sourceName,
                  element.source
                );
            }
          }
          if (!blockData[pathTo]) self._createObjectPath(blockData, pathTo, attachMethod);
          const blockDataPath = self._pathToObject(pathTo, blockData);
          // insert Fieldvalues in Path-Array
          if (attachMethod === 'push') blockDataPath.push(values);
          else _.extend(blockDataPath, values);
          // insert Fieldvalues in Mainpath
          if (elementParser.extendRoot === true) _.extend(blockData, values);
          blockData.index = blockIndex + 1;
        }
      }
      if (blockData.index && blockData.index > 0) parsedBlocks.push(blockData);
    }
    return parsedBlocks;
  }
  /**
   * Create a not existing Path in an Object
   *
   * @param src
   * @param path
   * @param {String} attachMethod Create last element as object or array: 'insert', 'push'
   * @returns {Object}
   */
  _createObjectPath(src, path, attachMethod) {
    if (!path) return src;
    const pathParts = path.split('.');
    let current = src;
    for (let i = 0; i < pathParts.length; i += 1) {
      const part = pathParts[i];
      if (!current[part]) {
        if (i === pathParts.length - 1 && attachMethod === 'push') current[part] = [];
        else current[part] = {};
      }
      current = current[part];
    }
    return current;
  }
  /**
   * Return Path to Object
   */
  _pathToObject(path, src) {
    if (!path) return src;
    const pathParts = path.split('.');
    let current = src;
    for (let i = 0; i < pathParts.length; i += 1) {
      const part = pathParts[i];
      current = current[part];
    }
    return current;
  }
  /**
   * Determine Blocks
   */
  _findBlocks() {
    const self = this;
    const blocks = [];
    let src = self.src;
    // Replace Linebreak with Unicode
    src = src.replace(/\n/g, '\uffff');
    const { docBlocksRegExp, inlineRegExp } = this.languages[self.extension] || this.languages['default'];
    let matches = docBlocksRegExp.exec(src);
    while (matches) {
      let block = matches[2] || matches[1];
      // Reverse Unicode Linebreaks
      block = block.replace(/\uffff/g, '\n').replace(inlineRegExp, '');
      blocks.push(block);
      // Find next
      matches = docBlocksRegExp.exec(src);
    }
    return blocks;
  }
  /**
   * Return block indexes with active API-elements
   *
   * An @apiIgnore ignores the block.
   * Other, non @api elements, will be ignored.
   */
  _findBlockWithApiGetIndex(blocks) {
    const foundIndexes = [];
    for (let i = 0; i < blocks.length; i += 1) {
      let found = false;
      for (let j = 0; j < blocks[i].length; j += 1) {
        // check apiIgnore
        if (blocks[i][j].name.substr(0, 9) === 'apiignore') {
          app.log.debug('apiIgnore found in block: ' + i);
          found = false;
          break;
        }
        // check app.options.apiprivate and apiPrivate
        if (!app.options.apiprivate && blocks[i][j].name.substr(0, 10) === 'apiprivate') {
          app.log.debug('private flag is set to false and apiPrivate found in block: ' + i);
          found = false;
          break;
        }
        if (blocks[i][j].name.substr(0, 3) === 'api') found = true;
      }
      if (found) {
        foundIndexes.push(i);
        app.log.debug('api found in block: ' + i);
      }
    }
    return foundIndexes;
  }
  /**
   * Get Elements of Blocks
   */
  findElements(block, filename) {
    const elements = [];
    // Replace Linebreak with Unicode
    block = block.replace(/\n/g, '\uffff');
    // Elements start with @
    const elementsRegExp = /(@(\w*)\s?(.+?)(?=\uffff[\s\*]*@|$))/gm;
    let matches = elementsRegExp.exec(block);
    while (matches) {
      const element = {
        source: matches[1],
        name: matches[2].toLowerCase(),
        sourceName: matches[2],
        content: matches[3],
      };
      // reverse Unicode Linebreaks
      element.content = element.content.replace(/\uffff/g, '\n');
      element.source = element.source.replace(/\uffff/g, '\n');
      app.hook('parser-find-element-' + element.name, element, block, filename);
      elements.push(element);
      app.hook('parser-find-elements', elements, element, block, filename);
      // next Match
      matches = elementsRegExp.exec(block);
    }
    return elements;
  }
}

/**
 * Exports
 */
module.exports = Parser;
