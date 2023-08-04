class SchemaString {
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

class SchemaNumber {
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

class SchemaArray {
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

class ObjectID {
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

class SchemaDate {
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

class SchemaBool {
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

const isChildSchema = (thing) =>
  typeof thing == "object" &&
  thing != null &&
  !Array.isArray(thing) &&
  !thing.type &&
  Object.keys(thing).length;

const isSchema = (obj) =>
  typeof obj.type === "function" &&
  validDataTypes.find((types) => types === obj.type);

class Schema {
  constructor(obj, options) {
    this.obj = obj;
    this.options = {
      timestamps: options.hasOwnProperty("timestamps"),
      typeKey: "type",
      id: true,
      _id: true,
      validateBeforeSave: Boolean(options.validate) || true,
      read: null,
      shardKey: null,
      discriminatorKey: "__t",
      autoIndex: null,
      minimize: true,
      optimisticConcurrency: false,
      versionKey: "__v",
      capped: false,
      bufferCommands: true,
      strictQuery: true,
      strict: obj.strict || true,
    };
    this.childSchemas = [];
    this._userOptions = options;
    this.paths = this.parse(obj);
    this.tree = {
      ...this.paths,
      ...this.parse({
        createdAt: {
          type: Date,
          immutable: true,
          default: new Date()
        },
        updatedAt: {
          type: Date,
          default: new Date()
        },
      })
    };
  }

  parse(obj) {
    const paths = {};
    for (const key in obj) {
      const field = obj[key];
      const table = this.parseTable(key, field);
      paths[key] = table;
    }
    
    
    const timestamp = Date.now().toString(16);
    const randomPart = Math.random().toString(16).slice(2, 10);

    paths["_id"] = this.parseTable("_id", {
      type: Object,
      default: `${timestamp}${randomPart}`.padEnd(24, '0').slice(0, 24),
    });

    paths["updatedAt"] = this.parseTable("updatedAt", {
      type: Date,
      immutable: true,
      default: new Date()
    });

    paths["createdAt"] = this.parseTable("createdAt", {
      type: Date,
      immutable: true,
      default: new Date()
    });

    return paths;
  }

  parseTable(path, table) {
    const expectedType = validDataTypes.find((p) => p.id === table.type);

    if (!isSchema(table) && isChildSchema(table)) {
      this.childSchemas.push({ [path]: table });
      return this.parse(table);
    }

    if (typeof expectedType.id === "function") {
      return new expectedType.class(path, table);
    }
  }

  parseChildSchema(schema) {
    return this.parse(schema);
  }
  
  validateData(data, instanceOfThis) {
    for (const key in instanceOfThis.tree) {
      const field = instanceOfThis.tree[key];
      const userSchema = instanceOfThis.obj[key] || {};
      const value = data[key] || userSchema['default'] || field.defaultValue;

      if (field.isRequired && value === undefined) {
        const error = `Field '${key}' is required but not provided.`;
        throw new Error (error);
      }

      if (field.instance === "Array") {
        if (!field.validateItems(value)) {
          const error = `Invalid items in the '${key}' array.`;
            throw new Error (error);
        }
        if (!field.minLengthValidator(value)) {
          const error = `Array '${key}' should have at least ${field.minLengthValidator.length} items.`;
            throw new Error (error);
        }
        if (!field.maxLengthValidator(value)) {
          const error = `Array '${key}' should have at most ${userSchema.maxlength.length} items.`;
            throw new Error (error);
        }
      } else {
        if (!['_id', 'updatedAt', 'createdAt'].includes(key) && typeof value !== field.instance.toLowerCase()) {
          const error = `Field '${key}' should be of type '${field.instance}'.`;
            throw new Error (error);
        }

        if (field.instance === "String") {
          if (!field.validateValue(value)) {
            const error = `Invalid value '${value}' for field '${key}'.`;
            throw new Error (error);
          }
          if (userSchema.minlength && field.minLengthValidator(value)) {
            const error = `String '${key}' should have at least ${userSchema.minlength} characters.`;
            throw new Error (error);
          }
          if (userSchema.maxlength && field.maxLengthValidator(value)) {
            const error = `String '${key}' should have at most ${userSchema.maxlength} characters.`;
            throw new Error (error);
          }
        } else if (field.instance === "Number") {
          if (!field.validateValue(value)) {
            const error = `Invalid value '${value}' for field '${key}'.`;
            throw new Error (error);
          }
          if (!field.minValueValidator(value)) {
            const error = `Number '${key}' should be greater than or equal to ${field.minValueValidator(value)}.`;
            throw new Error (error);
          }
          if (!field.maxValueValidator(value)) {
            const error = `Number '${key}' should be less than or equal to ${field.maxValueValidator(value)}.`;
            throw new Error (error);
          }
        } else if (field.instance === "Date") {
          if (!field.validateValue(value)) {
            const error = `Invalid value '${value}' for field '${key}'.`;
            throw new Error (error);
          }
        } else if (field.instance === "Boolean") {
          if (!field.validateValue(value)) {
            const error = `Invalid value '${value}' for field '${key}'.`;
            throw new Error (error);
          }
        } else if (field.instance === "ObjectID") {
          if (!field.validateValue(value)) {
            const error = `Invalid value '${value}' for field '${key}'.`;
            throw new Error (error);
          }
        }
      }
    }

    return {
      isValid: true,
    };
  }
}

module.exports = Schema;