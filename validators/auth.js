const {body} = require("express-validator");

const validateUserRegistration = [
    body("name")
    .trim()
    .notEmpty()
    .withMessage("Name is required.")
    .isLength({min: 3, max:15})
    .withMessage("Name must be contains 3-15 caracters."),
    body("password")
    .notEmpty()
    .withMessage("Password is required.")
    .isLength({min: 6})
    .withMessage("Password must be atleast 6 charecter")
    .matches(/\d/)
    .withMessage('Password must contain a number')
    .matches(/[a-z]/)
    .withMessage('Password must contain a lowercase letter')
    .matches(/[A-Z]/)
    .withMessage('Password must contain an uppercase letter')
    .matches(/[!@#$%^&*()\-_=+{}[\]|;:'",<.>/?\\]/)
    .withMessage('Password must contain a special symbol (!@#$%^&*()-_=+{}[]|;:\'",<.>/?\\)'),
]





module.exports = { validateUserRegistration,}