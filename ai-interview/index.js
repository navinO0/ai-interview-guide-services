const { DEMO, GET_QUESTION, GET_FEEDBACK, HISTORY } = require('./controllers/ai-controllers');
const { demoschema, get_questions_schema, get_feedback_schema } = require('./schemas/ai-schemas');
// const fastifyWebsocket = require('fastify-websocket');

module.exports = async (app) => {
    app.route({
        method: 'POST',
        url: '/public/demo',
        schema: demoschema,
        handler: DEMO,
    });

        app.route({
        method: 'POST',
        url: '/question',
        schema: get_questions_schema,
        handler: GET_QUESTION,
        });
    
        app.route({
        method: 'POST',
        url: '/feedback',
        schema: get_feedback_schema,
        handler: GET_FEEDBACK,
        });
    
     app.route({
        method: 'POST',
        url: '/history',
        schema: demoschema,
        handler: HISTORY,
    });

};
