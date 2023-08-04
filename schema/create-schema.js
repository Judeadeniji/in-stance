const validDataTypes = [String, Number, Boolean, Object, Array]

class Schema {
  constructor(schema) {
    this.schema = schema;
  }

  validate(tableSchema) {

    for (const column in tableSchema) {
      const dataType = tableSchema[column];
      
      if(typeof dataType == 'object' && !Array.isArray(dataType) && dataType !== null) return;
      
      if (!validDataTypes.includes(dataType)) {
        throw new Error(`Invalid data type "${dataType.name}" for column "${column}" in table.`);
      }
    }
  }

  generateSQL() {
    let sql = '';
    const schema = this.schema;
    const keys = Object.keys(schema);
    for (const key of keys) {
      const tableSchema = schema[key];
      this.validate(tableSchema);
      const columns = Object.keys(tableSchema).map(column => {
        const dataType = tableSchema[column];
        return `${column} ${this.getDataTypeString(dataType)}${this.getDefaultString(tableSchema, column)}`;
      });
      sql += `CREATE TABLE IF NOT EXISTS ${key} (${columns.join(', ')});\n`;
    }
    return sql;
  }

  getDataTypeString(dataType) {
    if (dataType === String) return 'TEXT';
    if (dataType === Number) return 'REAL';
    if (dataType === Boolean) return 'BOOLEAN';
    if (dataType === Object) return 'JSON';
    if (dataType === Array) return 'ARRAY';
    if (typeof dataType == 'object') {
      if (dataType.type) {
        return this.getDataTypeString(dataType.type);
      }
      return 'JSON';
    }
    
    throw new Error(`Unsupported data type "${dataType}".`);
  }

  getDefaultString(tableSchema, column) {
    const options = tableSchema[column];
    let defaultStr = '';

    if (options.hasOwnProperty('default')) {
      defaultStr = ` DEFAULT ${JSON.stringify(options.default)}`;
    }

    if (options.hasOwnProperty('timestamp') && options.timestamp === true) {
      defaultStr = ` DEFAULT CURRENT_TIMESTAMP`;
    }

    if (options.hasOwnProperty('id') && options.id === 'sequential') {
      defaultStr = ` PRIMARY KEY AUTOINCREMENT`;
    }

    return defaultStr;
  }
}

// Example usage:
const databaseSchema = {
  users: {
    id: Number,
    name: String,
    age: Number,
    active: Boolean,
    details: Object,
    created_at: { type: Number, timestamp: true }
  },
  products: {
    id: { type: String, id: 'sequential' },
    name: String,
    price: Number,
    categories: Array,
    updated_at: { type: Number, timestamp: true },
    description: { type: String, default: 'No description available' }
  }
};

const schema = new Schema(databaseSchema);
const sqlStatements = schema.generateSQL();
console.log(schema);
