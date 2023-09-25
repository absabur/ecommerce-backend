const jwt = require('jsonwebtoken');

const createJsonWebToken = (payload, secretKey, expiresIn) => {
    if (typeof payload !== 'object' || !payload) {
        throw new Error("payload must be a non empty object.")
    }  
    if (typeof secretKey !== 'string' || secretKey === "") {
        throw new Error("secret key needed and must be a string.")
    } 
    try {
        const token = jwt.sign(payload, secretKey, {expiresIn});
        return token;
    } catch (error) {
        logger.log("error","Failed to create jwt:", error)
        throw error;
    }
}

module.exports = { createJsonWebToken }