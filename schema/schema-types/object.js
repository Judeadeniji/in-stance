module.exports = class {
  constructor(path, schema) {
    this.path = path;
    this.instance = "ObjectID";
    this.RegExp = null;
    this.defaultValue = schema.default || null;
    this.validators = new Array();
    this.isRequired = schema.required || false;
    this.isUnique = true;
    this.immutable = true;
  }

  // Custom validation for ObjectID
  validateValue(value) {
    return typeof value === "string" && /^[0-9a-fA-F]{24}$/.test(value);
  }
}