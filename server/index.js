const express = require('express');
const bodyParser = require('body-parser');
const { apolloExpress, graphiqlExpress } = require('apollo-server');
const { PubSub } = require('graphql-subscriptions');

const { Scripts, Runs } = require('./models');
const { schema } = require('./graphql');
const SandboxManager = require('./sandbox-manager');
const {
  port: PORT,
  dockerConfig,
  sandboxesFolder,
} = require('./config');

const app = express();

const pubsub = new PubSub();
const sandboxManager = new SandboxManager(dockerConfig, sandboxesFolder, pubsub);

app.use('/graphql', bodyParser.json(), apolloExpress({
  schema,
  context: {
    Scripts,
    Runs,
    SandboxManager: sandboxManager,
    PubSub: pubsub,
  },
}));
app.use('/graphiql', graphiqlExpress({ endpointURL: '/graphql' }));

/* eslint no-console: 0 */
sandboxManager.init()
  .then(() => app.listen(PORT, () => console.log(`Ready on port ${PORT}`)))
  .catch(err => console.error(err));
