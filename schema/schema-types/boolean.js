module.exports = class {
  constructor(path, schema) {
    this.path = path;
    this.instance = "Boolean";
    this.RegExp = null;
    this.defaultValue = schema.default || null;
    this.validators = new Array();
    this.isRequired = schema.required || false;
    this.isUnique = schema.unique || false;
  }

  // Custom validation for Boolean
  validateValue(value) {
    return typeof value === "boolean";
  }
}