const {body} = require("express-validator");

const validateProduct = [
    body("name")
    .trim()
    .notEmpty()
    .withMessage("Product Name is required.")
    .isLength({min: 3})
    .withMessage("Product Name must be atleast 3 caracters."),
    body("description")
    .trim()
    .notEmpty()
    .withMessage("Product description is required.")
    .isLength({min: 15})
    .withMessage("Product description must be atleast 15 caracters."),
    body("price")
    .trim()
    .notEmpty()
    .withMessage("Product price is required.")
    .isFloat({min: 0})
    .withMessage("Product price must a positive number."),
    body("category")
    .trim()
    .notEmpty()
    .withMessage("Product category is required."),
    body("Stock")
    .trim()
    .notEmpty()
    .withMessage("Product quantity is required.")
    .isInt({min: 1})
    .withMessage("Product quantity must a positive number."),
]

module.exports = { validateProduct }