function startSanbox(sandbox, runId, Runs) {
  return Promise.resolve().then(() => {
    sandbox.subscribe('start', () => (
      Runs.update(runId, {
        status: 'RUNNING',
      })
    ));

    sandbox.subscribe('done', ({
      payload: { StatusCode },
    }) => (
      Runs.fetchById(runId).then(({
        created_at: createdAt,
      }) => (
        Runs.update(runId, {
          duration: new Date() - createdAt,
          status: StatusCode === 0 ? 'SUCCESS' : 'FAILED',
        })
      ))
    ));

    sandbox.subscribe('canceled', () => (
      Runs.fetchById(runId).then(({
        created_at: createdAt,
      }) => (
        Runs.update(runId, {
          duration: new Date() - createdAt,
          status: 'CANCELED',
        })
      ))
    ));

    return sandbox.run();
  })
  .catch((err) => {
    console.error('Error while starting the sandbox');
    console.error(err);
  });
}

module.exports = {
  Run: {
    logs: ({ sandbox_id: sandboxId }, _, { SandboxManager }) => SandboxManager.getLogs(sandboxId),
    status: ({ status }) => status,
    duration: ({ duration, created_at: createdAt }) => (
      duration != null ? duration : new Date() - createdAt
    ),

    script: ({ script_id: scriptId }, _, { Scripts }) => Scripts.fetchById(scriptId),
  },

  Script: {
    createDate: ({ created_at: createDate }) => createDate,
    runs: ({ id }, _, { Scripts }) => Scripts.runsBySrciptId(id),
  },

  Query: {
    script: (_, { id }, { Scripts }) => Scripts.fetchById(id),
  },

  Mutation: {
    postScript: (_, { content }, { Scripts }) => (
      Scripts.insertContent(content)
        .then(Scripts.fetchById)
    ),

    executeScript: (_, { id }, { SandboxManager, Scripts, Runs }) => (
      Scripts.fetchById(id).then(({ content }) => {
        const sandbox = SandboxManager.createSandboxe(content);
        return sandbox.init()
          .then(() => Runs.insertRun(id, sandbox.id))
          .then((runId) => {
            startSanbox(sandbox, runId, Runs);
            return Runs.fetchById(runId);
          });
      })
    ),
  },
};
