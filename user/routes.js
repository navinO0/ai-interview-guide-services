'use strict';

const userRoutes = require('./index');

module.exports = async (app) => {
    app.register(userRoutes, { prefix: '/user' });
};
