// @flow

const express = require('express');
const bodyParser = require('body-parser');
const { apolloExpress, graphiqlExpress } = require('apollo-server');
const cors = require('cors');

const { Scripts, Runs } = require('./models');
const { schema } = require('./graphql');
const SandboxManager = require('./sandbox/manager');
const { attachDebugListener } = require('./sandbox/helpers');
const {
  PORT,
  SANBOXES_FOLDER,
  dockerConfig,
} = require('./config');

const app = express();

const sandboxManager = new SandboxManager(SANBOXES_FOLDER);

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

    const sandbox = sandboxManager.createSandboxe('setTimeout(() => { console.log(\'bob\'); throw new Error() }, 1000)');
    attachDebugListener(sandbox);

    return sandboxManager.run(sandbox, {})
      .then(() => console.log('done'))
      .catch(err => console.error('WADADAWDWAD', err));
  })
  .catch(err => console.error(err));
