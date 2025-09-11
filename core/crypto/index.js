const crypto = require("crypto");

 

function decryptData(app, encryptedString) {
    try {
        const aesSecKeyHex = app.CONFIG.SECURITY_KEYS.KEY_HEX;
        const aesSecKey = Buffer.from(aesSecKeyHex, "hex");
        // Extract IV and encrypted text
        const [ivBase64, encryptedBase64] = encryptedString.split(":");

        if (!ivBase64 || !encryptedBase64) {
            throw new Error("Invalid encrypted data format");
        }

        const iv = Buffer.from(ivBase64, "base64"); 
        const encryptedBuffer = Buffer.from(encryptedBase64, "base64");

        if (iv.length !== 12) {
            throw new Error("Invalid IV length");
        }

        const decipher = crypto.createDecipheriv("aes-256-gcm", aesSecKey, iv);

        // Extract authentication tag from the end of encrypted data
        const authTag = encryptedBuffer.slice(-16); 
        const ciphertext = encryptedBuffer.slice(0, -16);

        decipher.setAuthTag(authTag); 
        let decrypted = decipher.update(ciphertext);
        decrypted += decipher.final("utf8"); 

        return decrypted;
    } catch (error) {
        console.error("Decryption failed:", error.message);
        throw new Error("Decryption error: " + error.message);
    }
}

// Decrypt all object values
function decryptObject(app, obj, dec_keys) {
    try {
        for (let key in obj) {
            if (!obj.hasOwnProperty(key)) continue;

            if (dec_keys.includes(key) && typeof obj[key] === "string") {
                obj[key] = decryptData(app, obj[key]);
            }

            else if (obj[key] && typeof obj[key] === "object" && !Array.isArray(obj[key])) {
                obj[key] = decryptObject(app, obj[key], dec_keys);
            }

            else if (Array.isArray(obj[key])) {
                obj[key] = obj[key].map(item => {
                    if (item && typeof item === "object") {
                        return decryptObject(app, item, dec_keys);
                    }
                    return item;
                });
            }
        }
        return obj;
    } catch (error) {
        throw error;
    }
}


module.exports = { decryptObject };
