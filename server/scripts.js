const knex = require('./connector');

function scriptById(id) {
  return knex('scripts')
    .where({ id })
    .then(([script]) => script);
}

function insertScript(content) {
  return knex
    .transaction(trx => (
      trx.into('scripts')
        .insert({ content })
    ))
    .then(([id]) => id);
}

module.exports = {
  scriptById,
  insertScript,
};
