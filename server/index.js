// @flow

const express = require('express');
const bodyParser = require('body-parser');
const { apolloExpress, graphiqlExpress } = require('apollo-server');
const { PubSub } = require('graphql-subscriptions');
const cors = require('cors');

const { Scripts, Runs } = require('./models');
const { schema } = require('./graphql');
const SandboxManager = require('./sandbox/manager');
const {
  port: PORT,
  dockerConfig,
  sandboxesFolder,
} = require('./config');

const app = express();

const sandboxManager = new SandboxManager(sandboxesFolder);

app.use(cors());
app.use('/graphql', bodyParser.json(), apolloExpress({
  schema,
  context: {
    Scripts,
    Runs,
    SandboxManager: sandboxManager,
  },
}));
app.use('/graphiql', graphiqlExpress({ endpointURL: '/graphql' }));

/* eslint no-console: 0 */
sandboxManager.init(dockerConfig)
  .then(() => {
    app.listen(PORT, () => console.log(`Ready on port ${PORT}`));

    const sandbox = sandboxManager.createSandboxe('setTimeout(() => console.log(\'bob\'), 1000)');
    return sandboxManager.run(sandbox, {})
      .then(() => console.log('done'))
      .catch(err => console.error('WADADAWDWAD', err));
  })
  .catch(err => console.error(err));
