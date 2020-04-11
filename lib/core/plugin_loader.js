import { forEach } from 'lodash';
import { join, relative } from 'path';
import { sync } from 'glob';

let app = {};

class PluginLoader {
  constructor(_app) {
    const self = this;
    // global variables
    app = _app;
    // class variables
    self.plugins = {};
    // Try to load global apidoc-plugins (if apidoc is installed locally it tries only local)
    this.detectPlugins(__dirname);
    // Try to load local apidoc-plugins
    this.detectPlugins(join(process.cwd(), '/node_modules'));
    if (Object.keys(this.plugins).length === 0) {
      app.log.debug('No plugins found.');
    }
    this.loadPlugins();
  }
  /**
   * Detect modules start with "apidoc-plugin-".
   * Search up to root until found a plugin.
   */
  detectPlugins(dir) {
    const self = this;
    // Every dir start with "apidoc-plugin-", because for the tests of apidoc-plugin-test.
    let plugins;
    try {
      plugins = sync(dir + '/apidoc-plugin-*').concat(sync(dir + '/@*/apidoc-plugin-*'));
    } catch (e) {
      app.log.warn(e);
      return;
    }
    if (plugins.length === 0) {
      dir = join(dir, '..');
      if (dir === '/' || dir.substr(1) === ':\\') {
        return;
      }
      return this.detectPlugins(dir);
    }
    const offset = dir.length + 1;
    plugins.forEach(function(plugin) {
      const name = plugin.substr(offset);
      const filename = relative(__dirname, plugin);
      app.log.debug('add plugin: ' + name + ', ' + filename);
      self.addPlugin(name, plugin);
    });
  }
  /**
   * Add Plugin to plugin list.
   */
  addPlugin(name, filename) {
    if (this.plugins[name]) {
      app.log.debug('overwrite plugin: ' + name + ', ' + this.plugins[name]);
    }
    this.plugins[name] = filename;
  }
  /**
   * Load and initialize Plugins.
   */
  loadPlugins() {
    forEach(this.plugins, function(filename, name) {
      app.log.debug('load plugin: ' + name + ', ' + filename);
      let plugin;
      try {
        plugin = require(filename);
      } catch (e) {}
      if (plugin && plugin.init) {
        plugin.init(app);
      } else {
        app.log.debug('Ignored, no init function found.');
      }
    });
  }
}

/**
 * Exports
 */
module.exports = PluginLoader;
