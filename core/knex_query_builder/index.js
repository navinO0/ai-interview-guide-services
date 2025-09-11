'use strict';

const getKnexClient = require('./setup');

const knexClientCreate = async (app, options, key) => {
  try {
    const db = await getKnexClient({ options: options });
    app.decorate([key || 'knex'], db);
  } catch (exce) {
    // eslint-disable-next-line no-console
    console.log(`DB connection failed`);
    setTimeout(() => {
      // eslint-disable-next-line no-process-exit
      process.exit(1);
    }, 1000);
    throw Error(`Connection Failed ${exce}`);
  }
};

module.exports = {
  knexClientCreate
};
