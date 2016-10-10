// @flow
/* global $Shape */
const knex = require('./connector');

export type Status =
  | 'PENDING'
  | 'RUNNING'
  | 'SUCCESS'
  | 'FAILED';

export type Run = {
  id: string,
  status: Status,
};

export type Script = {
  id: string,
  runs?: Run[],
}

function list(table: string, limit: number, offset: number) {
  return knex(table)
    .limit(limit)
    .offset(offset);
}

function getById(table: string, id: number) {
  return knex(table)
    .where({ id })
    .fiest();
}

const Runs = {
  list(limit: number, offset: number): Promise<Run[]> {
    return list('runs', limit, offset);
  },

  fetchById(id: number): Promise<Run> {
    return getById('runs', id);
  },

  insertRun(
    scriptId: string,
    containerId: string,
    status: Status = 'PENDING',
  ): Promise<Run> {
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

  update(runId: string, fields: $Shape<Run>): Promise<any> {
    return knex
      .transaction(trx => (
        trx.into('runs')
          .where({ id: runId })
          .update(fields)
      ));
  },
};

const Scripts = {
  list(limit : number, offset : number) : Promise<Script[]> {
    return list('scripts', limit, offset);
  },

  fetchById(id: number): Promise<Script> {
    return getById('scripts', id);
  },

  insertContent(content: string): Promise<Script> {
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

  runsBySrciptId(scriptId: string): Promise<Run[]> {
    return knex('runs')
      .where({ script_id: scriptId });
  },
};

module.exports = {
  Runs,
  Scripts,
};
