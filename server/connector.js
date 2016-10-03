const knex = require('knex');
const knexfile = require('../scripts/knexfile');

module.exports = knex(knexfile);
