const Ajv = require("ajv");
const AjvErrors = require("ajv-errors");
const addFormats = require("ajv-formats");
const headers = {
    withAuthorization: {
      type: "object",
      additionalProperties: true,
      required: ["Authorization"],
      properties: {
        Authorization: {
          description: "The x-auth-token generated after successful login",
          type: "string",
        },
      },
    },
  };
  
  const commonErrorSchema = {
    type: "object",
    additionalProperties: true,
    properties: {
      errors: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: true,
          properties: {
            code: { type: "string" },
            message: { type: "string" },
            error: {
              type: "object",
              additionalProperties: true,
            },
          },
        },
      },
    },
  };
  
  const validationErrorSchema = {
    type: "object",
    additionalProperties: true,
    properties: {
      errors: {
        type: "array",
        items: {
          type: "object",
          properties: {
            property: { type: "string" },
            message: { type: "string" },
            code: { type: "string" },
          },
        },
      },
    },
};
  

  async function ajvCompiler(app, options) {
    const ajv = new Ajv({
        removeAdditional: true,
        useDefaults: true,
        coerceTypes: true,
        allErrors: true,
        allowUnionTypes: true,
        strict: false
    });
    AjvErrors(ajv);
    addFormats(ajv);
    app.setValidatorCompiler(({ schema }) => {
        return ajv.compile(schema);
    });
}
  
  const errorSchemas = {
    400: validationErrorSchema,
    401: commonErrorSchema,
    404: commonErrorSchema,
    405: commonErrorSchema,
    415: commonErrorSchema,
    429: commonErrorSchema,
    500: commonErrorSchema,
    502: commonErrorSchema,
  };
  
  module.exports = {
    headers,
    errorSchemas,
    validationErrorSchema,
    ajvCompiler
  };