const {
  SchemaString,
  SchemaArray,
  SchemaNumber,
  SchemaBool,
  ObjectID,
  SchemaDate
} = require("./schema-types");


const validDataTypes = [
  {
    id: String,
    class: SchemaString,
  },
  {
    id: Number,
    class: SchemaNumber,
  },
  {
    id: Array,
    class: SchemaArray,
  },
  {
    id: Object,
    class: ObjectID,
  },
  {
    id: Boolean,
    class: SchemaBool,
  },
  {
    id: Date,
    class: SchemaDate,
  },
];

module.exports = {
  validDataTypes
};