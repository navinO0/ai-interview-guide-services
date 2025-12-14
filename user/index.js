const { LOGIN, SIGNUP, GOOGLE_AUTH, GET_DEVICES, DELETE_DEVICES } = require('./controllers/user-controllers');
const { loginSchema, signupSchema, googleAuthSchema, getDevicesSchema, deleteDevicesSchema } = require('./schemas/user-schemas');

module.exports = async (app) => {
    // Public routes (no authentication required)
    app.route({
        method: 'POST',
        url: '/public/login',
        schema: loginSchema,
        handler: LOGIN,
    });

    app.route({
        method: 'POST',
        url: '/public/signup',
        schema: signupSchema,
        handler: SIGNUP,
    });

    app.route({
        method: 'POST',
        url: '/public/google-auth',
        schema: googleAuthSchema,
        handler: GOOGLE_AUTH,
    });

    // Protected routes (authentication required)
    app.route({
        method: 'GET',
        url: '/get/devices',
        schema: getDevicesSchema,
        handler: GET_DEVICES,
    });

    app.route({
        method: 'POST',
        url: '/delete/devices',
        schema: deleteDevicesSchema,
        handler: DELETE_DEVICES,
    });
};
