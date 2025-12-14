const { replySuccess, replyError } = require("../../core/core_funcs");
const { generateToken } = require("../../core/token_generate_validate");
const { decryptObjectValues } = require("../../core/crypto");
const bcrypt = require("bcrypt");
const { getCacheValue, setCacheValue } = require("../../core/redis_config/redis_client");
const CONFIG = require("../../core/config");

async function LOGIN(request, reply) {
    try {
        const { username, password, device_info } = request.body;
        
        if (!device_info || !device_info.fingerprint) {
            return replyError(reply, { message: "Device information is required" });
        }

        // Decrypt credentials
        const decryptedData = await decryptObjectValues({ username, password }, ['username', 'password']);
        
        // Query user from database
        const user = await this.knex("users")
            .where({ username: decryptedData.username })
            .first();

        if (!user) {
            return replyError(reply, { message: "Invalid username or password" });
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(decryptedData.password, user.password);
        
        if (!isPasswordValid) {
            return replyError(reply, { message: "Invalid username or password" });
        }

        // Generate token with device info
        const token = await generateToken(this, {
            id: user.id,
            username: user.username,
            email: user.email,
            first_name: user.first_name,
            last_name: user.last_name
        }, device_info);

        return replySuccess(reply, { 
            message: "Login successful",
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                first_name: user.first_name,
                last_name: user.last_name
            }
        });
    } catch (err) {
        console.error("Login error:", err);
        return replyError(reply, err);
    }
}

async function SIGNUP(request, reply) {
    try {
        const { username, password, email, first_name, last_name, device_info } = request.body;

        if (!device_info || !device_info.fingerprint) {
            return replyError(reply, { message: "Device information is required" });
        }

        // Decrypt credentials
        const decryptedData = await decryptObjectValues({ username, password, email }, ['username', 'password', 'email']);

        // Check if user already exists
        const existingUser = await this.knex("users")
            .where({ username: decryptedData.username })
            .orWhere({ email: decryptedData.email })
            .first();

        if (existingUser) {
            return replyError(reply, { message: "Username or email already exists" });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(decryptedData.password, 10);

        // Create user
        const [newUser] = await this.knex("users")
            .insert({
                username: decryptedData.username,
                password: hashedPassword,
                email: decryptedData.email,
                first_name: first_name || "",
                last_name: last_name || ""
            })
            .returning("*");

        // Generate token
        const token = await generateToken(this, {
            id: newUser.id,
            username: newUser.username,
            email: newUser.email,
            first_name: newUser.first_name,
            last_name: newUser.last_name
        }, device_info);

        return replySuccess(reply, {
            message: "User created successfully",
            token,
            user: {
                id: newUser.id,
                username: newUser.username,
                email: newUser.email,
                first_name: newUser.first_name,
                last_name: newUser.last_name
            }
        });
    } catch (err) {
        console.error("Signup error:", err);
        return replyError(reply, err);
    }
}

async function GOOGLE_AUTH(request, reply) {
    try {
        const { email, name, google_id, device_info } = request.body;

        if (!device_info || !device_info.fingerprint) {
            return replyError(reply, { message: "Device information is required" });
        }

        // Check if user exists
        let user = await this.knex("users")
            .where({ email })
            .first();

        if (!user) {
            // Create new user
            const [newUser] = await this.knex("users")
                .insert({
                    email,
                    username: email.split('@')[0],
                    first_name: name || "",
                    google_id,
                    password: "" // No password for Google auth users
                })
                .returning("*");
            user = newUser;
        } else if (!user.google_id && google_id) {
            // Link Google account to existing user
            await this.knex("users")
                .where({ id: user.id })
                .update({ google_id });
        }

        // Generate token
        const token = await generateToken(this, {
            id: user.id,
            username: user.username,
            email: user.email,
            first_name: user.first_name,
            last_name: user.last_name
        }, device_info);

        return replySuccess(reply, {
            message: "Google authentication successful",
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                first_name: user.first_name,
                last_name: user.last_name
            }
        });
    } catch (err) {
        console.error("Google auth error:", err);
        return replyError(reply, err);
    }
}

async function GET_DEVICES(request, reply) {
    try {
        const { username } = request.user_info;
        
        const cachedData = await getCacheValue(username + CONFIG.REDIS.DEVICES_KEY);
        
        if (!cachedData) {
            return replySuccess(reply, { 
                message: "No devices found",
                devices: [] 
            });
        }

        const devices = JSON.parse(cachedData);
        
        return replySuccess(reply, { 
            message: "Devices retrieved successfully",
            devices 
        });
    } catch (err) {
        console.error("Get devices error:", err);
        return replyError(reply, err);
    }
}

async function DELETE_DEVICES(request, reply) {
    try {
        const { username } = request.user_info;
        const { device_fingerprint, is_remove_all_devices } = request.body;

        if (is_remove_all_devices) {
            // Remove all devices
            await setCacheValue(username + CONFIG.REDIS.DEVICES_KEY, JSON.stringify([]));
            return replySuccess(reply, { 
                message: "All devices removed successfully" 
            });
        }

        if (!device_fingerprint) {
            return replyError(reply, { message: "Device fingerprint is required" });
        }

        const cachedData = await getCacheValue(username + CONFIG.REDIS.DEVICES_KEY);
        
        if (!cachedData) {
            return replySuccess(reply, { 
                message: "No devices found" 
            });
        }

        const devices = JSON.parse(cachedData);
        const updatedDevices = devices.filter(d => d.fingerprint !== device_fingerprint);
        
        await setCacheValue(username + CONFIG.REDIS.DEVICES_KEY, JSON.stringify(updatedDevices));
        
        return replySuccess(reply, { 
            message: "Device removed successfully" 
        });
    } catch (err) {
        console.error("Delete devices error:", err);
        return replyError(reply, err);
    }
}

module.exports = { LOGIN, SIGNUP, GOOGLE_AUTH, GET_DEVICES, DELETE_DEVICES };
