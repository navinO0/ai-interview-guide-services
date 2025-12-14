const loginSchema = {
    tags: ['user'],
    summary: "User Login",
    description: `<h3>This API allows users to login with username and password.</h3>`,
    rbac: ["*"],
    body: {
        type: "object",
        properties: {
            username: {
                type: "string",
                description: "Encrypted username",
                example: "encrypted_username_here"
            },
            password: {
                type: "string",
                description: "Encrypted password",
                example: "encrypted_password_here"
            },
            device_info: {
                type: "object",
                description: "Device fingerprint information",
                properties: {
                    fingerprint: { type: "string" },
                    deviceType: { type: "string" },
                    os: { type: "string" },
                    browser: { type: "string" },
                    userAgent: { type: "string" },
                    screenResolution: { type: "string" },
                    platform: { type: "string" },
                    language: { type: "string" }
                },
                required: ["fingerprint"]
            }
        },
        required: ["username", "password", "device_info"],
        additionalProperties: false
    }
};

const signupSchema = {
    tags: ['user'],
    summary: "User Registration",
    description: `<h3>This API allows new users to create an account.</h3>`,
    rbac: ["*"],
    body: {
        type: "object",
        properties: {
            username: {
                type: "string",
                description: "Encrypted username",
                example: "encrypted_username_here"
            },
            password: {
                type: "string",
                description: "Encrypted password",
                example: "encrypted_password_here"
            },
            email: {
                type: "string",
                description: "Encrypted email address",
                example: "encrypted_email_here"
            },
            first_name: {
                type: "string",
                description: "User's first name"
            },
            last_name: {
                type: "string",
                description: "User's last name"
            },
            device_info: {
                type: "object",
                description: "Device fingerprint information",
                properties: {
                    fingerprint: { type: "string" },
                    deviceType: { type: "string" },
                    os: { type: "string" },
                    browser: { type: "string" },
                    userAgent: { type: "string" },
                    screenResolution: { type: "string" },
                    platform: { type: "string" },
                    language: { type: "string" }
                },
                required: ["fingerprint"]
            }
        },
        required: ["username", "password", "email", "device_info"],
        additionalProperties: false
    }
};

const googleAuthSchema = {
    tags: ['user'],
    summary: "Google OAuth Authentication",
    description: `<h3>This API handles Google OAuth authentication.</h3>`,
    rbac: ["*"],
    body: {
        type: "object",
        properties: {
            email: {
                type: "string",
                description: "User's email from Google",
                example: "user@gmail.com"
            },
            name: {
                type: "string",
                description: "User's name from Google",
                example: "John Doe"
            },
            google_id: {
                type: "string",
                description: "User's Google ID"
            },
            device_info: {
                type: "object",
                description: "Device fingerprint information",
                properties: {
                    fingerprint: { type: "string" },
                    deviceType: { type: "string" },
                    os: { type: "string" },
                    browser: { type: "string" },
                    userAgent: { type: "string" },
                    screenResolution: { type: "string" },
                    platform: { type: "string" },
                    language: { type: "string" }
                },
                required: ["fingerprint"]
            }
        },
        required: ["email", "name", "device_info"],
        additionalProperties: false
    }
};

const getDevicesSchema = {
    tags: ['user'],
    summary: "Get User Devices",
    description: `<h3>This API retrieves all registered devices for the authenticated user.</h3>`,
    rbac: ["*"]
};

const deleteDevicesSchema = {
    tags: ['user'],
    summary: "Delete User Device(s)",
    description: `<h3>This API removes device(s) from the user's account.</h3>`,
    rbac: ["*"],
    body: {
        type: "object",
        properties: {
            device_fingerprint: {
                type: "string",
                description: "Fingerprint of the device to remove"
            },
            is_remove_all_devices: {
                type: "boolean",
                description: "Remove all devices if true",
                example: false
            }
        },
        additionalProperties: false
    }
};

module.exports = { 
    loginSchema, 
    signupSchema, 
    googleAuthSchema, 
    getDevicesSchema, 
    deleteDevicesSchema 
};
