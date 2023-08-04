module.exports = class {
  constructor(path, schema) {
    this.path = path;
    this.instance = "String";
    this.RegExp = null;
    this.defaultValue = schema.default || null;
    this.validators = new Array();
    this.isRequired = schema.required || false;
    this.isUnique = schema.unique || false;
    this.minLengthValidator = this.validateMinlength(schema.minlength || 0);
    this.maxLengthValidator = this.validateMaxlength(
      schema.maxlength || Infinity
    );
    if (!this.validateValue(this.defaultValue)) {
      new Error("Invalid value " + this.defaultValue + ", expected a string");
    }
  }

  validateMinlength(len) {
    return (len2) => len2 < len;
  }

  validateMaxlength(len) {
    return (len2) => len2 > len;
  }

  validateValue(value) {
    return typeof value !== "string" ? false : true;
  }
}