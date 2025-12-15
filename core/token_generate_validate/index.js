
const jwt = require('jsonwebtoken');

const { getCacheValue, setCacheValue } = require('../redis_config/redis_client');
const CONFIG = require('../config');

const generateToken = async (app, userdata, device_info) => {
    try {
        userdata.fingerprint = device_info.fingerprint;
        const token = jwt.sign(
            userdata,
            CONFIG.SECURITY_KEYS.JWT_SECRET,
            { expiresIn: CONFIG.REDIS.TOKEN_EXPIRY_IN_SECS }
        );
        
        await setCacheValue(userdata.username + "_token", token, CONFIG.REDIS.TOKEN_EXPIRY_IN_SECS);
        
        const cachedData = await getCacheValue(userdata.username + CONFIG.REDIS.DEVICES_KEY);
        
        if (cachedData) {
            const devices = JSON.parse(cachedData);
            const exist = devices.find(e => e.fingerprint === device_info.fingerprint);
            
            if (exist) {
                return token;
            }
            devices.push(device_info);
            await setCacheValue(userdata.username + CONFIG.REDIS.DEVICES_KEY, JSON.stringify(devices));
        } else {
            await setCacheValue(userdata.username + CONFIG.REDIS.DEVICES_KEY, JSON.stringify([device_info]));
        }
        
        return token;
    } catch (error) {
        throw new Error('Error generating token: ' + error.message);
    }
}


const APIs = ["login", "logout", "signup", "public", "internal", "socket.io"]


async function validateAccessToken({ request }, reply, app) {
    try {
        const { url } = request.raw;
        const index = APIs.findIndex(e => url.includes(e));
        
        if (index !== -1) {
            return; // Public API
        }

        if (!request.headers || !request.headers['authorization']) {
             console.log("Token Validation Failed: No authorization header");
             return reply.code(401).send({ code: 401, type: 'error', "message": "Authorization required" });
        }
        
        if (!request.headers['authorization'].includes("Bearer")) {
            console.log("Token Validation Failed: Header format invalid (missing Bearer)");
            return reply.code(401).send({ code: 401, type: 'error', "message": "Authorization required" });
        }
        
        const token = request.headers['authorization'].split(" ")[1];
        if (!token || token === '') {
            console.log("Token Validation Failed: Token string is empty");
            return reply.code(401).send({ code: 401, type: 'error', "message": "Authorization required" });
        }
        
        // Debug Decode
        let decoded;
        try {
            decoded = jwt.verify(token, CONFIG.SECURITY_KEYS.JWT_SECRET);
        } catch (err) {
            console.log("Token Validation Failed: JWT Verification failed", err.message);
             return reply.code(401).send({ code: 401, type: 'error', "message": "Authorization required" });
        }

        request.token = token;
        request.user_info = decoded;
        
        if (!decoded || Object.keys(decoded).length === 0) {
             console.log("Token Validation Failed: Decoded payload is empty");
            return reply.code(401).send({ code: 401, type: 'error', "message": "Authorization required" });
        }
        
        const redisKey = decoded.username + CONFIG.REDIS.DEVICES_KEY;
        // console.log("Checking Redis Key:", redisKey);
        
        const cachedData = await getCacheValue(redisKey);
        if (!cachedData) {
            console.log(`Token Validation Failed: Session not found in Redis for key: ${redisKey}`);
            return reply.code(401).send({ code: 401, type: 'error', "message": "Authorization required" });
        }
        
        const devices = JSON.parse(cachedData);
        // console.log("Cached Devices:", devices.map(d => d.fingerprint));
        // console.log("Request Fingerprint:", decoded.fingerprint);

        const exist = devices.find(e => e.fingerprint === decoded.fingerprint);
        if (!exist) {
             console.log("Token Validation Failed: Device fingerprint mismatch");
            return reply.code(401).send({ code: 401, type: 'error', "message": "Authorization required" });
        }

    } catch (error) {
        console.log("Token Validation Failed: Uncaught error", error);
        return reply.code(401).send({ code: 401, type: 'error', "message": "Authorization required", error: error.message });
    }
};

async function decodeToken(token) {
    try {
        const decoded = jwt.verify(token, CONFIG.SECURITY_KEYS.JWT_SECRET);
        return decoded;
    } catch (error) {
        throw error;
    }
}


module.exports = { generateToken, validateAccessToken, decodeToken }