const {
  insertScript,
  scriptById,
} = require('./scripts');

module.exports = {
  Run: {
    logs: runner => runner.getLogs(),
  },

  Query: {
    script: (_, { id }) => scriptById(id),
  },

  Mutation: {
    postScript: (_, { content }) => (
      insertScript(content)
        .then(scriptById)
    ),
  },
};
