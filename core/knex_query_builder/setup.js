'use strict';

// eslint-disable-next-line node/no-extraneous-require
const knex = require('knex');
// const setupPaginator = require('./paginator');

const connectionCheck = db => db.raw('select 1+1 as result');

const getKnexClient = async ({ options }) => {
  try {
    // eslint-disable-next-line node/no-unsupported-features/es-syntax
    const db = knex({ ...options });
    await connectionCheck(db);
    // setupPaginator(db);
    await connectionCheck(db);
    return db;
  } catch (exce) {
    // eslint-disable-next-line no-console
    console.log({ message: `DB connection failed`, err: exce });
    throw Error(`Connection Failed ${exce}`);
  }
};

module.exports = getKnexClient;
