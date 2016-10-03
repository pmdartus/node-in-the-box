const knex = require('knex');
const knexfile = require('../db/knexfile');

module.exports = knex(knexfile);
