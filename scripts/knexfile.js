const path = require('path');

const DB_PATH = path.resolve(__dirname, '../dev.sqlite3');

module.exports = {
  client: 'sqlite3',
  connection: {
    filename: DB_PATH,
  },
  useNullAsDefault: true,
};
