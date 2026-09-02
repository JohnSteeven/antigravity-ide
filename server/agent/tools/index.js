const { ToolRegistry } = require("./ToolRegistry");
const { definitions } = require("./definitions");

const registry = new ToolRegistry();
definitions.forEach((definition) => registry.register(definition));

module.exports = { registry, ToolRegistry };
