module.exports = class {
  constructor(path, schema) {
    this.path = path;
    this.instance = "Array";
    this.of = schema.of || null; // The type of items in the array
    this.minLengthValidator = this.validateMinLength(schema.minlength || 0);
    this.maxLengthValidator = this.validateMaxLength(
      schema.maxlength || Infinity
    );
    this.RegExp = null;
    this.defaultValue = schema.default || null;
    this.validators = new Array();
    this.isRequired = schema.required || false;
    this.isUnique = schema.unique || false;
  }

  validateMinLength(minLength) {
    return (array) => array.length >= minLength;
  }

  validateMaxLength(maxLength) {
    return (array) => array.length <= maxLength;
  }

  validateItems(items) {
    if (!this.of) return true;
    return [...items].every((item) => typeof item === this.of);
  }
}