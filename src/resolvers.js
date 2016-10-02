const {
  getRunner,
  newRunner,
} = require('./runner');

module.exports = {
  Run: {
    content: runner => runner.getContent(),
    logs: runner => runner.getLogs(),
  },

  Query: {
    run: (_, { id }) => getRunner(id),
  },

  Mutation: {
    postRun: (_, { content }) => (
      newRunner(content).then((runner) => {
        runner.run();
        return runner;
      })
    ),
  },
};
