const knex = require('./connector');

function runsByScriptId(scriptId) {
  return knex('runs')
    .where({ script_id: scriptId });
}

function insertRun(scriptId, containerId, status = 'RUNNING') {
  return knex
    .transaction(trx => (
      trx.into('runs')
        .insert({
          status,
          script_id: scriptId,
          container_id: containerId,
          created_at: new Date(),
        })
    ))
    .then(([id]) => id);
}

function runById(id) {
  return knex('runs')
    .where({ id })
    .then(([run]) => run);
}

function updateRunStatus(containerId, status = 'SUCCESS') {
  return knex.transaction(trx => (
    trx.into('runs')
      .where({ container_id: containerId })
      .then(([run]) => {
        const duration = new Date() - run.created_at;

        return trx.into('runs')
          .where({ container_id: containerId })
          .update({ status, duration });
      })
  ))
  .catch(console.error);
}

module.exports = {
  runsByScriptId,
  insertRun,
  runById,
  updateRunStatus,
};
