const express = require('express');
const bodyParser = require('body-parser');
const { makeExecutableSchema } = require('graphql-tools');
const { apolloExpress, graphiqlExpress } = require('apollo-server');

const { initRunner } = require('./runner');
const typeDefs = require('./schema');
const resolvers = require('./resolvers');

const PORT = 3000 || process.env.PORT;
const app = express();

const schema = makeExecutableSchema({
  typeDefs,
  resolvers,
});

app.use('/graphql', bodyParser.json(), apolloExpress({ schema }));
app.use('/graphiql', graphiqlExpress({ endpointURL: '/graphql' }));

/* eslint no-console: 0 */
initRunner()
  .then(() => app.listen(PORT, () => console.log(`Ready on port ${PORT}`)))
  .catch(err => console.error(err));
