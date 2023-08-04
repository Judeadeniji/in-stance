module.exports = class {
  constructor(path, schema) {
    this.path = path;
    this.instance = "Number";
    this.minValueValidator = this.validateMinValue(
      schema.min || Number.MIN_SAFE_INTEGER
    );
    this.maxValueValidator = this.validateMaxValue(
      schema.max || Number.MAX_SAFE_INTEGER
    );
    this.RegExp = null;
    this.defaultValue = schema.default || null;
    this.validators = new Array();
    this.isRequired = schema.required || false;
    this.isUnique = schema.unique || false;
  }

  validateMinValue(minValue) {
    return (value) => value >= minValue;
  }

  validateMaxValue(maxValue) {
    return (value) => value <= maxValue;
  }
}