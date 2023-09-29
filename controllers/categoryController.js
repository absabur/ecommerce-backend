const createError = require("http-errors");
const Category = require("../models/categoryModel")

const handleCreateCategory = async (req, res, next) => {
    try {
        const { name } = req.body;
        const data = await Category.find({})

        data.forEach(element => {
            if (element.name.toLowerCase() === name.toLowerCase().trim()) {
                throw createError(400, "Category already exist")
            }
        });

        const newCategory = await Category.create({name})
        res.status(200).json({
            success: true,
            newCategory,
          });
    } catch (error) {
        next(error)
    }
}

const handleGetCategory = async (req, res, next) => {
    try {
        const categories = await Category.find({});
        if (!categories) {
            throw createError(404, "No category to show")
        }
        res.status(200).json({
            success: true,
            categories,
          });
    } catch (error) {
        next(error)
    }
}


const handleUpdateCategoryBySlug = async (req, res, next) => {
    try {
        const { name } = req.body;
        const id = req.params.id;
        const data = await Category.find({})

        data.forEach(element => {
            if (element.name === name.trim()) {
                throw createError(400, "Category already exist")
            }
        });
        const updatedCategory = await Category.findByIdAndUpdate(id, {name})

        if (!updatedCategory) {
            throw createError(404, "category not found to update.")
        }
        res.status(200).json({
            success: true,
            updatedCategory,
          });
    } catch (error) {
        next(error)
    }
}

const handleDeleteCategoryBySlug = async (req, res, next) => {
    try {
        const name = req.params.name;
        const deletedCategory = await Category.findOneAndDelete({name})
        if (!deletedCategory) {
            throw createError(404, "category not found to delete.")
        }
        res.status(200).json({
            success: true,
            name: deletedCategory.name,
          });
    } catch (error) {
        next(error)
    }
}

module.exports = { handleCreateCategory, handleGetCategory, handleUpdateCategoryBySlug, handleDeleteCategoryBySlug }