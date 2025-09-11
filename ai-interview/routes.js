'use strict';

const loginRoutes = require('./index');


module.exports = async (app) => {
    app.register(loginRoutes, { prefix: '/ai/interview' });
};