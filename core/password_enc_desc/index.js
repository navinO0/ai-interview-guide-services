const bcrypt = require('bcrypt'); 

async function hashPassword(password) {
    try {
        // Generate salt
        const salt = await bcrypt.genSalt(10); 

        const hashedPassword = await bcrypt.hash(password, salt);

        console.log("Hashed Password:", hashedPassword);

        return hashedPassword; // For now, just return the hashed password
    } catch (error) {
        console.error('Error hashing password:', error);
    }
}


async function verifyPassword(enteredPassword, storedHash) {
    try {
        const match = await bcrypt.compare(enteredPassword, storedHash);
        if (match) {
            return true
        } 
        return false
    } catch (error) {
        console.error('Error verifying password:', error);
    }
}

module.exports = { hashPassword, verifyPassword };