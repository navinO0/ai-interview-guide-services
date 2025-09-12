
const jwt = require('jsonwebtoken');

const { getCacheValue, setCacheValue } = require('../redis_config/redis_client');
const CONFIG = require('../config');
const genereateToke = async (app, userdata, devvice_info) => {

    // Generate a JWT token
    userdata.fingerprint = devvice_info.fingerprint
    const token = jwt.sign(
        userdata,
        app.CONFIG.SECURITY_KEYS.JWT_SECRET,
        { expiresIn: '4h' }
    );
    await setCacheValue(userdata.username + "_token", token, CONFIG.REDIS.TOKEN_EXPIRY_IN_SECS)
    const cachedData = await getCacheValue(userdata.username + CONFIG.REDIS.DEVICES_KEY)
    if (cachedData) {
        const devices = JSON.parse(cachedData)
        const exist = devices.find(e => e.
            fingerprint === devvice_info.
                fingerprint)
        if (exist) {
            return token
        }
        devices.push(devvice_info)
        await setCacheValue(userdata.username + CONFIG.REDIS.DEVICES_KEY, JSON.stringify(devices))
    } else {
        await setCacheValue(userdata.username + CONFIG.REDIS.DEVICES_KEY, JSON.stringify([devvice_info]))
    }
    // await setCacheValue(userdata.username+"_token_devices", token, CONFIG.REDIS.TOKEN_EXPIRY_IN_SECS)
    return token
}


const APIs = ["login", "logout", "signup", "public", "internal", "socket.io"]


async function validateAccessToken({ request }, reply, app) {
    try {
        const { url } = request.raw;
        const index = APIs.findIndex(e => url.includes(e));
        if (index === -1) {
            if (request.headers && !request.headers['authorization']) {
                return reply.code(401).send({ code: 401, type: 'error', "message": "Authorization required" });
            } else {
                if (request.headers['authorization'].includes("Bearer")) {
                    const token = request.headers['authorization'].split(" ")[1];
                    try {
                        if (!token || token === '') {
                            return reply.code(401).send({ code: 401, type: 'error', "message": "Authorization required" });
                        }
                        const decoded = jwt.verify(token, app.CONFIG.SECURITY_KEYS.JWT_SECRET);
                        request.token = token
                        request.user_info = decoded
                        if (!decoded || Object.keys(decoded).length === 0) {
                            return reply.code(401).send({ code: 401, type: 'error', "message": "Authorization required" });
                        }
                         const cachedData = await getCacheValue(decoded.username + CONFIG.REDIS.DEVICES_KEY)
                        if (!cachedData) {
                            return reply.code(401).send({ code: 401, type: 'error', "message": "Authorization required" });
                        }
                        const devices = JSON.parse(cachedData)
                            const exist = devices.find(e => e.
                                fingerprint === decoded.
                                    fingerprint)
                            if (!exist) {
                                return reply.code(401).send({ code: 401, type: 'error', "message": "Authorization required" });
                            }
                        // const chached_token = await getCacheValue(decoded.username + "_token")
                        // if (chached_token !== token) {
                        //     return reply.code(401).send({ code: 401, type: 'error', "message": "Authorization required" });
                        // }

                    } catch (error) {
                        throw error;
                    }
                } else {
                    return reply.code(401).send({ code: 401, type: 'error', "message": "Authorization required" });
                }
            }
        } else {
            // updateHeaders(request.headers, {});
            // console.log("this api doesn't require token")
        }
    } catch (error) {
        return reply.code(401).send({ code: 401, type: 'error', "message": "Authorization required" });
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


module.exports = { genereateToke, validateAccessToken, decodeToken }