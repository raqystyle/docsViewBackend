#!/usr/bin/env node

var program = require("commander");
var api = require("./api");

program
.version(require('./package.json').version)
.usage('[options]')
.option('-c, --config-file <config/user_config.json>', 'Configuration file with documentation root and path to the tree')
.option('-r, --docs-root <path/to/docs>', 'The root of the docs')
.option('-t, --tree-file <path/to/tree.json>', 'Path to the generated tree file')
.option('-p, --port <3000>', 'Port to bind the server to')
.parse(process.argv);

if (program.configFile) {
  api.runApi(require(program.configFile));
} else {
  require('./config-generator');
}
