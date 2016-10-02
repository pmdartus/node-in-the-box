'use strict';

const express = require('express');
const bodyParser = require('body-parser');

const {
  initRunner,
  newRunner,
  getRunner,
} = require('./runner'); 

const app = express();
app.use(bodyParser.json());

app.get('/run/:id', ({ params }, res) => {
  if (!params.id || typeof params.id !== 'string') {
    return res.satuts(400).send('Expect an id params');
  }

  const runner = getRunner(params.id);
  if (!runner) {
    return res.sendStatus(404);
  }

  return runner.status()
    .then(info => res.send(info))
    .catch(err => res.status(500).send(err))
});

app.post('/run', ({ body }, res) => {
  if (!body.content || typeof body.content !== 'string') {
    return res.status(400).send('Expect content key in payload');
  }

  const userCode = body.content;
  newRunner(userCode)
    .then(runner => {
      runner.run();
      return res.send({ id: runner.id });
    })
    .catch(err => res.status(500).send(err))
});

initRunner()
  .then(() => app.listen(3000, () => console.log(`Ready on port 3000`)))
  .catch(err => console.error(err));