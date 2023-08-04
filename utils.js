const path = require("path");
const fs = require("fs");
const Database = require("./database");

const databases = new Map();

const ModelMap = new Map();

function noop() {}

var configuration = {
  defaultName: 'dafault',
  currentDB: 'default',
  auth: false,
  credentials: {
    user: 'root',
    password: 'root'
  },
  path: '.in-stance'
}

function getConfigFile() {
  try {
    var configContent = fs.readFileSync(path.join(process.cwd(), 'instance.cfg'), 'utf-8');
    return configContent;
  } catch (err) {
    console.error("Cannot find instance.cfg in your root folder");
    return null;
  }
}

function parseLine(line, inMultiLineComment) {
  line = line.trim();

  // Check for multi-line comments (enclosed within single or double quotes)
  if (inMultiLineComment) {
    if (line.endsWith("'") || line.endsWith('"')) {
      return line.substring(0, line.length - 1).trim();
    } else {
      return '';
    }
  } else {
    // Check for single-line comments (starting with #)
    var commentIndex = line.indexOf('#');
    if (commentIndex !== -1) {
      line = line.substring(0, commentIndex).trim();
    }

    // Check for multi-line comments (enclosed within single or double quotes)
    if ((line.startsWith("'") && line.endsWith("'")) || (line.startsWith('"') && line.endsWith('"'))) {
      return '';
    }

    return line;
  }
}


function parseConfig(config) {
  var lines = config.split('\n');
  var jsObject = {
    credentials: {}
  };

  lines.forEach(function(line) {
    var parsedLine = parseLine(line);
    if (parsedLine !== '') {
      var parts = parsedLine.split('=');
      if (!parts[1]) return;
      var key = parts[0].trim();
      var value = parts[1].trim();
      

      if (key === "user" || key === "password") {
        jsObject.credentials[key] = isNaN(value) ? value : Number(value);
        return;
      }
      
      jsObject[key] = isNaN(value) ? value : Number(value);
    }
  });

  return jsObject;
}

function loadConfig(config) {
  if (config !== null) {
    var configObject = parseConfig(config);
    Object.assign(configuration, configObject);
    console.log(configuration);
  }
}


function createDB(dbName) {
  var configContent = getConfigFile();
  loadConfig(configContent)
  const databaseDirectory = path.join(process.cwd(), configuration.path, dbName);
  fs.mkdirSync(databaseDirectory, { recursive: true });

  // Create a new Database instance for the specified name
  databases.set(dbName, new Database(databaseDirectory));
  
  useDB(dbName);
}

function useDB(dbName) {
  configuration.currentDB = dbName;
}


module.exports = {
  noop,
  createDB,
  useDB,
  databases,
  ModelMap,
  config: configuration
};