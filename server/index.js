const express = require('express');
const bodyParser = require('body-parser');
const { makeExecutableSchema } = require('graphql-tools');
const { apolloExpress, graphiqlExpress } = require('apollo-server');
const { PubSub } = require('graphql-subscriptions');

const {
  port: PORT,
  dockerConfig,
  sandboxesFolder,
} = require('./config');
const typeDefs = require('./schema');
const resolvers = require('./resolvers');
const {
  Scripts,
  Runs,
} = require('./models');
const SandboxManager = require('./sandbox-manager');

const app = express();
const schema = makeExecutableSchema({ typeDefs, resolvers });

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
