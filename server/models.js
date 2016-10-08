const knex = require('./connector');

const Runs = {
  list(limit, offset) {
    return knex('runs')
      .limit(limit)
      .offset(offset);
  },

  fetchById(id) {
    return knex('runs')
      .where({ id })
      .then(([run]) => run);
  },

  insertRun(scriptId, containerId, status = 'PENDING') {
    return knex
      .transaction(trx => (
        trx.into('runs')
          .insert({
            status,
            script_id: scriptId,
            sandbox_id: containerId,
            created_at: new Date(),
          })
      ))
      .then(([id]) => id);
  },

  update(runId, fields) {
    return knex
      .transaction(trx => (
        trx.into('runs')
          .where({ id: runId })
          .update(fields)
      ));
  },
};

const Scripts = {
  list(limit, offset) {
    return knex('scripts')
      .limit(limit)
      .offset(offset);
  },

  fetchById(id) {
    return knex('scripts')
      .where({ id })
      .then(([script]) => script);
  },

  insertContent(content) {
    return knex
      .transaction(trx => (
        trx.into('scripts')
          .insert({
            content,
            created_at: new Date(),
          })
      ))
      .then(([id]) => id);
  },

  runsBySrciptId(scriptId) {
    return knex('runs')
      .where({ script_id: scriptId });
  },
};

module.exports = {
  Runs,
  Scripts,
};
