const {
  insertScript,
  scriptById,
} = require('./scripts');

const {
  runsByScriptId,
  insertRun,
  runById,
  updateRunStatus,
} = require('./runs');

const {
  createRunner,
  getRunnerLogs,
} = require('./runner');

module.exports = {
  Run: {
    logs: ({ container_id: containerId }) => getRunnerLogs(containerId),
    status: ({ status }) => status,
    duration: ({ duration, created_at: createdAt }) => (
      duration != null ? duration : new Date() - createdAt
    ),

    script: ({ script_id: scriptId }) => scriptById(scriptId),
  },

  Script: {
    createDate: ({ created_at: createDate }) => createDate,
    runs: ({ id }) => runsByScriptId(id),
  },

  Query: {
    script: (_, { id }) => scriptById(id),
  },

  Mutation: {
    postScript: (_, { content }) => (
      insertScript(content)
        .then(scriptById)
    ),

    executeScript: (_, { id }) => (
      scriptById(id)
        .then(({ content }) => createRunner(content))
        .then((runner) => {
          const containerId = runner.container.id;

          runner.run()
            .then(() => updateRunStatus(containerId))
            .catch(status => updateRunStatus(containerId, status));
          return insertRun(id, containerId);
        })
        .then(runById)
    ),
  },
};
