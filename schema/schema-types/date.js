module.exports = class {
  constructor(path, schema) {
    this.path = path;
    this.instance = "Date";
    this.defaultValue = schema.default || null;
    this.RegExp = null;
    this.defaultValue = schema.default || null;
    this.validators = new Array();
    this.isRequired = schema.required || false;
    this.isUnique = schema.unique || true;
  }

  // Custom validation for Date
  validateValue(value) {
    return value instanceof Date || typeof value === "string";
  }
}