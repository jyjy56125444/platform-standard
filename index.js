#!/usr/bin/env node

'use strict';

const Application = require('egg').Application;

const app = new Application({
  mode: 'single',
});

app.ready(() => {
  console.log('Egg application is ready!');
});

app.listen(7001, () => {
  console.log('Server is running on http://localhost:7001');
});
