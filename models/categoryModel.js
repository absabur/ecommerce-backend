const { Schema, model } = require("mongoose")

const categorySchema = new Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        unique: true,
        minlength: [3, 'Category Name must be atleast 3 charecter..'],
    },
}, {timestamps: true})

const Category = model('category', categorySchema)

module.exports = Category;