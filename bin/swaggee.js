#!/usr/bin/env node

'use strict';

const path = require('path');
const program = require('commander');
const swaggee = require('../lib/index');
const version = require('../package').version;

program.version(version, '-v, --version', 'Output the version');

program
  .option(
    '-f, --file-filters [file-filters]',
    'Regexp to select files that should be parsed (multiple -f can be used)',
    collect,
    '.*\\.(clj|coffee|cs|dart|erl|go|java|js|php?|py|rb|ts|pm)$'
  )

  .option(
    '-e, --exclude-filters [exclude-filters]',
    'Regexp to select files or directories that should not be parsed (multiple -e can be used)',
    collect,
    ''
  )

  .option('-i, --input [input]', 'Source directory or file', './src')

  .option('-o, --output [output]', 'Output dirname', './doc/')

  .option('--verbose', 'Verbose debug output', false)

  .option('--debug', 'Show debug messages', false)

  .option('--color', 'Turn off log color', true)

  .option(
    '--no-file',
    'Parse only the files and return the data, no file creation',
    false
  )

  .option(
    '--parse-filters <parse-filters>',
    'Optional user defined filters',
    commaSeparated
  )
  .option(
    '--parse-parsers <parse-parsers>',
    'Optional user defined parsers',
    commaSeparated
  )
  .option(
    '--parse-workers <parse-workers>',
    'Optional user defined workers',
    commaSeparated
  )
  .option(
    '--parse-languages <parse-languages>',
    'Optional user defined languages',
    commaSeparated
  )

  .option('--no-silent', 'Turn all output on', false)

  .option('--simulate', 'Execute but not write any file', false)

  // markdown settings
  .option('--markdown', 'Turn off markdown parser', true)

  .option(
    '--marked-config [marked-config]',
    'Enable custom markdown parser configs. It will overwrite all other marked settings',
    ''
  )

  .option('--marked-gfm', 'Enable GitHub flavored markdown', true)

  .option(
    '--marked-tables',
    'Enable GFM tables. This option requires the gfm option to be true',
    true
  )

  .option(
    '--marked-breaks',
    'Enable GFM line breaks. This option requires the gfm option to be true',
    false
  )

  .option(
    '--marked-pedantic',
    'Conform to obscure parts of markdown.pl as much as possible',
    false
  )

  .option(
    '--marked-sanitize',
    'Sanitize the output. Ignore any HTML that has been input',
    false
  )

  .option(
    '--marked-smartLists',
    'Use smarter list behavior than the original markdown',
    false
  )

  .option(
    '--marked-smartypants',
    "Use 'smart' typographic punctuation for things like quotes and dashes",
    false
  );

const argv = program.parse(process.argv);

/**
 * @param value
 * @returns {Array|*|string[]}
 */
function commaSeparated(value) {
  return value.replace(', ', ',').split(',');
}

/**
 * @param value
 * @param previous
 * @returns {Buffer | Array | * | any[] | string}
 */
function collect(value, previous) {
  if (typeof previous === 'string') {
    previous = [];
  }
  return previous.concat([value]);
}

/**
 * Transform parameters to object
 *
 * @param {String|String[]} filters
 * @returns {Object}
 */
function transformToObject(filters) {
  if (!filters) return;

  if (typeof filters === 'string') filters = [filters];

  const result = {};
  filters.forEach(function(filter) {
    const splits = filter.split('=');
    if (splits.length === 2) {
      result[splits[0]] = path.resolve(splits[1], '');
    }
  });
  return result;
}

/**
 * Sets configuration for markdown
 *
 * @param {Array} argv
 * @returns {Object}
 */
function resolveMarkdownOptions(argv) {
  if (argv.markedConfig) {
    return require(path.resolve(argv.markedConfig));
  }

  return {
    gfm: argv.markedGfm,
    tables: argv.markedTables,
    breaks: argv.markedBreaks,
    pedantic: argv.markedPedantic,
    sanitize: argv.markedSanitize,
    smartLists: argv.markedSmartLists,
    smartypants: argv.markedSmartypants,
  };
}

const options = {
  excludeFilters: argv.excludeFilters,
  includeFilters: argv.fileFilters,
  src: argv.input,
  dest: argv.output,
  verbose: argv.verbose,
  debug: argv.debug,
  parse: argv.file,
  colorize: argv.color,
  filters: transformToObject(argv.parseFilters),
  languages: transformToObject(argv.parseLanguages),
  parsers: transformToObject(argv.parseParsers),
  workers: transformToObject(argv.parseWorkers),
  silent: argv.silent,
  simulate: argv.simulate,
  markdown: argv.markdown,
  marked: resolveMarkdownOptions(argv),
};

if (swaggee.createSwaggee(options) === false) {
  process.exit(1);
}
