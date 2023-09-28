const express = require("express");
const { isLoggedIn, isLoggedOut, isAdmin } = require("../middleware/auth");
const { handleCreateCategory, handleGetCategory, handleUpdateCategoryBySlug, handleDeleteCategoryBySlug } = require("../controllers/categoryController");
const categoryRouter = express.Router();

categoryRouter.post("/", isLoggedIn, isAdmin, handleCreateCategory)
categoryRouter.get("/", handleGetCategory)
categoryRouter.put("/:id", isLoggedIn, isAdmin, handleUpdateCategoryBySlug )
categoryRouter.delete("/:name", isLoggedIn, isAdmin, handleDeleteCategoryBySlug )

module.exports = categoryRouter;