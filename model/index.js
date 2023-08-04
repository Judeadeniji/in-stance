const fs = require('fs');
const path = require('path');
const { databases, noop, ModelMap, config } = require('../utils');


class Model {
  constructor(key, schemaInstance) {
    const database = databases.get(config.currentDB);
    ModelMap.set(key, schemaInstance);
    this.key = key;
    this.database = database;
  }
  
  async create(data) {
    return await this.database.create(this.key, data);
  }
  
  async getAll() {
    return await this.database.getAllData(this.key);
  }

  async find(query) {
    return await this.database.get(this.key, query);
  }

  async update(query, update) {
    return await this.database.update(this.key, query, update);
  }

  async delete(query, cb = noop) {
    return await this.database.delete(this.key, query, cb);
  }
  
  async deleteMany(query, cb = noop) {
    return await this.database.deleteMany(this.key, query, cb);
  }
}

module.exports = Model