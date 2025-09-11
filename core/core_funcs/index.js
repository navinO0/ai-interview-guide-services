const { append } = require("ramda");
const { logger } = require("../../server");

function generateUniqueCode() {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'; 
    let code = '';

    for (let i = 0; i < 6; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length); 
        code += characters[randomIndex]; 
    }

    return code; 
}

const replyError = (reply, errorObject, error, dynamicProperties = {}) => {

    if (!errorObject) {
        errorObject = {};
    }

    errorObject.status = false;
    errorObject.type = 'error';
    errorObject.statusCode = errorObject?.statusCode || 400;
    errorObject.message = errorObject.message || 'Something went wrong. Please try again';

    if (Object.keys(dynamicProperties).length > 0) {
        errorObject.dynamicProperties = dynamicProperties;
    }
    const logData = {
        ...errorObject,
        // errorObject,
        // ...parseException(errorObject),
        // ...error,
    };
    logger.error(logData);
    return reply.code(400).send(logData);
}

function parseException(error) {
    return {
        exception: error?.message || 'Exception details not available',
        error_stack: error?.stack || ''
    }
}

function replySuccess(reply, result, addOnProperties = {}) {

    const response = {
        status: true,
        success: true,
        count: 1,
        data: result || {},
        type: 'object',
        ...addOnProperties
    }

    if (result && Array.isArray(result)) {
        response.count = result.length;
        response.type = 'array'
    }
    // logger.info(response);
    return reply.code(200).send(response);
}

module.exports = { generateUniqueCode, replyError, replySuccess }