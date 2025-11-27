'use strict';

const fs = require('fs');
const path = require('path');
// eslint-disable-next-line node/no-extraneous-require
const knex = require('knex');
// const setupPaginator = require('./paginator');

const connectionCheck = db => db.raw('select 1+1 as result');


const getKnexClient = async ({ options }) => {
  try {
    const opts = { ...options };
    opts.connection = { ...(opts.connection || {}) };
    if (process.env.DB_SSL === 'true') {
      const caFile = process.env.DB_CA_FILE; // path to rds-combined-ca-bundle.pem
      if (caFile) {
        try {
          const fullPath = path.isAbsolute(caFile) ? caFile : path.join(process.cwd(), caFile);
          const ca = fs.readFileSync(fullPath).toString();
          opts.connection.ssl = { ca };
          console.log('DB: SSL enabled using CA file:', fullPath);
        } catch (fsErr) {
          // If CA file can't be read, fall back to rejectUnauthorized=false but log warning.
          console.warn('DB: failed to read DB_CA_FILE, falling back to rejectUnauthorized=false', fsErr);
          opts.connection.ssl = { rejectUnauthorized: false };
        }
      } else {
        // Quick debug mode (not for production)
        opts.connection.ssl = { rejectUnauthorized: false };
        console.log('DB: SSL enabled with rejectUnauthorized=false (insecure — use CA file in production)');
      }
    }
    const db = knex({ ...opts });
    await connectionCheck(db);
    await connectionCheck(db);

    console.log('DB: connected successfully');
    return db;
  } catch (exce) {
    // eslint-disable-next-line no-console
    console.error('DB connection failed — full error:', exce);
    // Re-throw a sanitized error so caller can decide how to handle it
    throw new Error(`DB Connection Failed: ${exce.message || exce}`);
  }
};

module.exports = getKnexClient;
