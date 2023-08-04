const path = require("path");
const fs = require("fs");


class Database {
  constructor(databaseDirectory) {
    this.databaseDirectory = databaseDirectory;
    const ModelMap = require("./utils").ModelMap;
    this.schema = ModelMap;
  }
  
  // Helper method to validate data against the schema
  validate(key, data) {
    const schemaInstance = this.schema.get(key);
    // Pre validation check
    for (const field in data) {
      //console.log(field);
    }
    const validationResult = schemaInstance.validateData(data, schemaInstance);
    return validationResult;
  }

  async isFieldUnique(key, field, value) {
    const data = await this.getAllData(key);
    return !data.find((item) => item[field] === value);
  }

  async saveData(key, data) {
    const filePath = path.join(this.databaseDirectory, key);
    await fs.promises.mkdir(filePath, { recursive: true });
    for (const item of data) {
      const dateFile = this.getTodayDateFileName();
      const fullPath = path.join(filePath, dateFile);
      await fs.promises.writeFile(fullPath, JSON.stringify(item, null, 2));
    }
  }

  getTodayDateFileName() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    const hours = String(today.getHours()).padStart(2, "0");
    const minutes = String(today.getMinutes()).padStart(2, "0");
    const seconds = String(today.getSeconds()).padStart(2, "0");
    return `${year}-${month}-${day}-${hours}-${minutes}-${seconds}.json`;
  }
  
  // Helper method to check if an item matches the query
  matchQuery(item, query) {
    for (const key in query) {
      if (query.hasOwnProperty(key)) {
        if (item[key] !== query[key]) {
          return false;
        }
      } else if (item !== query) {
        return false;
      }
    }
    return true;
  }
  
  // Helper method to save all data for a specific key (collection)
  async saveAllData(key, data) {
    const filePath = path.join(this.databaseDirectory, key);
    await fs.promises.mkdir(filePath, { recursive: true });

    for (const item of data) {
      const dateFile = this.getTodayDateFileName();
      const fullPath = path.join(filePath, dateFile);
      await fs.promises.writeFile(fullPath, JSON.stringify(item, null, 2));
    }
  }

  async createMany(key, dataList) {
    const createdItems = [];
    for (const data of dataList) {
      try {
        const createdItem = await this.create(key, data);
        createdItems.push(createdItem);
      } catch (error) {
        throw error;
      }
    }
    return createdItems;
  }

  async updateMany(key, query, update) {
    const updatedItems = [];
    const data = await this.getAllData(key);
    for (const item of data) {
      if (this.matchQuery(item, query)) {
        Object.assign(item, update);
        updatedItems.push(item);
      }
    }
    if (updatedItems.length > 0) {
      await this.saveData(key, data);
    }
    return updatedItems;
  }

  async deleteMany(key, query, cb) {
    const dataWithFileNames = await this.getAllDataWithFileNames(key);
    const itemsToDelete = dataWithFileNames.filter((item) => this.matchQuery(item.data, query));

    if (itemsToDelete.length > 0) {
      const deletedItems = [];
      for (const item of itemsToDelete) {
        const fullPath = path.join(this.databaseDirectory, key, item.fileName);
        await fs.promises.unlink(fullPath, cb);
        deletedItems.push(item.data);
      }
      return deletedItems;
    }

    return null;
  }
  
  async create(key, data) {
    const schemaInstance = this.schema.get(key);
    for (const p in schemaInstance.tree) {
      const field = schemaInstance.tree[p];
      if (!data[field.path] && field.defaultValue) {
        data[field.path] = field?.defaultValue;
      }
      if (field.isUnique && !(await this.isFieldUnique(key, p, data[field.path]))) {
        throw new Error(`Field '${p}' must be unique, but the provided value '${data[field.path]}' already exists.`);
      }
    }
    const validationResult = this.validate(key, data);
    if (!validationResult.isValid) {
      throw new Error("Data does not match the schema");
    }
    await this.createData(key, data);
    return data;
  }

  async read(key, query) {
    const data = await this.getAllData(key);
    return query ? data.filter((item) => this.matchQuery(item, query)) : data;
  }

  async update(key, query, update) {
    const data = await this.getAllData(key);
    const itemsToUpdate = data.filter((item) => this.matchQuery(item, query));

    if (itemsToUpdate.length > 0) {
      for (const item of itemsToUpdate) {
        Object.assign(item, update);
      }
      await this.saveData(key, data);
      return itemsToUpdate;
    }

    return null;
  }

  async delete(key, query, cb) {
    const dataWithFileNames = await this.getAllDataWithFileNames(key);
    const itemsToDelete = dataWithFileNames.filter((item) => this.matchQuery(item.data, query));

    if (itemsToDelete.length > 0) {
      for (const item of itemsToDelete) {
        const fullPath = path.join(this.databaseDirectory, key, item.fileName);
        await fs.unlink(fullPath, cb);
      }
      return itemsToDelete.map((item) => item.data);
    }

    return null;
  }

  async createData(key, data) {
    const filePath = path.join(this.databaseDirectory, key);
    await fs.promises.mkdir(filePath, { recursive: true });
    const dateFile = this.getTodayDateFileName();
    const fullPath = path.join(filePath, dateFile);
    await fs.promises.writeFile(fullPath, JSON.stringify(data, null, 2));
  }

  async getAllData(key) {
    const dataWithFileNames = await this.getAllDataWithFileNames(key);
    return dataWithFileNames.map((item) => item.data);
  }

  async getAllDataWithFileNames(key) {
    const filePath = path.join(this.databaseDirectory, key);
    try {
      const files = await fs.promises.readdir(filePath);
      const dataWithFileNames = [];
      for (const file of files) {
        const fullPath = path.join(filePath, file);
        const content = await fs.promises.readFile(fullPath, "utf8");
        const item = JSON.parse(content);
        dataWithFileNames.push({ fileName: file, data: item });
      }
      return dataWithFileNames;
    } catch (error) {
      return [];
    }
  }
}

module.exports = Database;