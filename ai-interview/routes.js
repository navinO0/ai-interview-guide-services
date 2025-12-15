'use strict';

const loginRoutes = require('./index');


module.exports = async (app) => {
    app.register(loginRoutes, { prefix: '/ai/interview' });
    app.register(loginRoutes, { prefix: '/' }); // Expose on root as well
};