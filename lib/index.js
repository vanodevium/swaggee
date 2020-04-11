require('@babel/register');

const core = require('./core');
const _ = require('lodash');
const winston = require('winston');
const path = require('path');
const markdown = require('marked');
const fs = require('fs-extra');
const Info = require('./info');

const swaggee = require('./swaggee');

const defaults = {
  dest: path.join(__dirname, '../doc/'),
  template: path.join(__dirname, '../template/'),

  debug: false,
  silent: true,
  verbose: false,
  simulate: false,
  parse: false, // only parse and return the data, no file creation
  colorize: true,
  markdown: true,

  marked: {
    gfm: true,
    tables: true,
    breaks: false,
    pedantic: false,
    sanitize: false,
    smartLists: false,
    smartypants: false,
  },
};

const app = {
  log: {},
  markdown: false,
  options: {},
};

// uncaughtException
process.on('uncaughtException', function(err) {
  console.error(new Date().toUTCString() + ' uncaughtException:', err.message);
  console.error(err.stack);
  process.exit(1);
});

function createSwaggee(options) {
  let api;
  const apidocPath = path.join(__dirname, '../');
  let packageInfo;

  options = _.defaults({}, options, defaults);

  // paths
  options.dest = path.join(options.dest, './');

  // options
  app.options = options;

  // logger
  app.log = winston.createLogger({
    transports: [
      new winston.transports.Console({
        level: app.options.debug ? 'debug' : app.options.verbose ? 'verbose' : 'info',
        silent: app.options.silent,
        prettyPrint: true,
        colorize: app.options.colorize,
        timestamp: false,
      }),
    ],
  });

  // markdown
  if (app.options.markdown === true) {
    app.markdown = markdown;
    app.markdown.render = markdown;
    app.markdown.setOptions(app.options.marked);
  }

  try {
    packageInfo = new Info(app);

    // generator information
    const json = JSON.parse(fs.readFileSync(apidocPath + 'package.json', 'utf8'));
    core.setGeneratorInfos({
      name: json.name,
      time: _.toString(new Date()),
      url: json.url,
      version: json.version,
    });
    core.setLogger(app.log);
    core.setMarkdownParser(app.markdown);
    core.setPackageInfos(packageInfo.get());

    api = core.parse(app.options);

    if (api === true) {
      app.log.info('Nothing to do');
      return true;
    }
    if (api === false) {
      app.log.info('Empty source or error while parsing');
      return false;
    }

    if (app.options.parse) {
      const apidocData = JSON.parse(api.data);
      const projectData = JSON.parse(api.project);
      api.swaggerData = JSON.stringify(swaggee.toSwagger(apidocData, projectData), null, 2);
      createOutputFile(api);
    }

    app.log.info('Done');
    return api;
  } catch (e) {
    console.log(e);

    app.log.error(e.message);
    if (e.stack) app.log.debug(e.stack);
    return false;
  }
}

function createOutputFile(api) {
  if (app.options.simulate) app.log.warn('!!! Simulation !!! No file or dir will be copied or created');

  app.log.verbose('create dir: ' + app.options.dest);
  if (!app.options.simulate) fs.mkdirsSync(app.options.dest);

  //Write swagger
  app.log.verbose('write swagger json file: ' + app.options.dest + 'swagger.json');
  if (!app.options.simulate) fs.writeFileSync(app.options.dest + './swagger.json', api.swaggerData);
}

module.exports = {
  createSwaggee: createSwaggee,
};
