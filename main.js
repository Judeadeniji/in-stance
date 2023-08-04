const { createDB } = require("./utils");
const Model = require("./model");
const schema = require("./schema");


module.exports = {
  createDatabase: createDB,
  Model,
  Schema: schema
};