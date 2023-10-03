const express = require("express");
const { getAllProducts, createProduct, updateProduct, deleteProduct, getProduct, createProductReview, deleteReview, getProductReviews, getAllProductsByAdmin } = require("../controllers/productController");
const { isLoggedIn, isAdmin } = require("../middleware/auth");
const {validateProduct} = require("../validators/products");
const runValidation = require("../validators");

const productRouter = express.Router()


productRouter.get("/", getAllProducts);

productRouter.get("/admin",isLoggedIn, isAdmin, getAllProductsByAdmin);

productRouter.get("/:id([0-9a-fA-F]{24})", getProduct);

productRouter.post("/new",isLoggedIn, isAdmin, validateProduct, runValidation, createProduct);

productRouter.put("/:id([0-9a-fA-F]{24})",isLoggedIn, isAdmin, validateProduct, runValidation, updateProduct);

productRouter.put("/create-review",isLoggedIn, createProductReview);

productRouter.delete("/:id([0-9a-fA-F]{24})",isLoggedIn, isAdmin, deleteProduct);

productRouter.get("/reviews", getProductReviews);

productRouter.put("/reviews",isLoggedIn, isAdmin, deleteReview);


module.exports = productRouter;