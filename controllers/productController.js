const createError = require("http-errors");
const Product = require("../models/productModel.js");
const User = require("../models/userModel.js");
const Category = require("../models/categoryModel.js");
const cloudinary = require("cloudinary");
const { localTime } = require("../utils/localTime.js");

exports.createProduct = async (req, res, next) => {
  try {
    let images = [];
    if (typeof req.body.images === "string") {
      images.push(req.body.images);
    } else {
      images = req.body.images;
    }
    const imagesLinks = [];
    for (let i = 0; i < images.length; i++) {
      const result = await cloudinary.v2.uploader.upload(images[i], {
        folder: "products",
      });
      imagesLinks.push({
        public_id: result.public_id,
        url: result.secure_url,
      });
    }
    req.body.images = imagesLinks;

    req.body.user = req.user.id;
    req.body.specification = JSON.parse(req.body.specification);
    req.body.createDate = localTime(0);
    req.body.updateDate = localTime(0);
    const product = await Product.create(req.body);
    if (!product) {
      throw createError(404, "unable to create product");
    }
    res.status(200).json({
      success: true,
      product,
    });
  } catch (error) {
    next(error);
  }
};

exports.getAllProducts = async (req, res, next) => {
  try {
    const search = req.query.search || "";
    let category = req.query.category || "";
    const sort = req.query.sort || "";
    const lte = Number(req.query.lte) || 1000000;
    const gte = Number(req.query.gte) || 0;
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 8;

    let makeSort = {};
    if (sort === "Top Sales") {
      makeSort = { sold: -1 };
    } else if (sort === "Top Reviews") {
      makeSort = { numOfReviews: -1 };
    } else if (sort === "Newest Arrivals") {
      makeSort = { createdAt: -1 };
    } else if (sort === "Price Low to High") {
      makeSort = { price: +1 };
    } else if (sort === "Price High to Low") {
      makeSort = { price: -1 };
    } else {
      makeSort = { updatedAt: -1 };
    }

    const searchRegExp = new RegExp(".*" + search + ".*", "i");

    if (category == "" || category == "null") {
      var filter = {
        $or: [{ name: { $regex: searchRegExp } }],
        $and: [{ price: { $lte: lte, $gte: gte } }],
      };
    } else {
      if (category.length !== 24) {
        const categoryfind = await Category.findOne({ name: category });
        category = categoryfind._id;
      }
      var filter = {
        $or: [{ name: { $regex: searchRegExp } }],
        $and: [{ price: { $lte: lte, $gte: gte } }, { category: category }],
      };
    }

    const products = await Product.find(filter)
      .limit(limit)
      .skip((page - 1) * limit)
      .sort(makeSort);

    if (!products) {
      throw createError(400, "Product is not avilable");
    }
    const count = await Product.find(filter).countDocuments();

    res.status(200).json({
      success: true,
      products,
      pagination: {
        number_of_Products: count,
        number_of_product_in_a_page: limit,
        number_of_Pages: Math.ceil(count / limit),
        currentPage: page,
        prevPage: page - 1 > 0 ? page - 1 : null,
        nextPage: page + 1 <= Math.ceil(count / limit) ? page + 1 : null,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.getAllProductsByAdmin = async (req, res, next) => {
  try {
    let sort = req.query.sort || "";
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 8;
    let name = req.query.name || "";
    let id = req.query.id || "";

    if (id === "null") {
      id = "";
    }
    if (sort === "null") {
      sort = "";
    }
    if (name === "null") {
      name = "";
    }
    let makeSort = {};
    if (sort === "Top Sales") {
      makeSort = { sold: -1 };
    } else if (sort === "Top Reviews") {
      makeSort = { numOfReviews: -1 };
    } else if (sort === "High Rated") {
      makeSort = { ratings: -1 };
    } else if (sort === "Newest Arrivals") {
      makeSort = { createdAt: -1 };
    } else if (sort === "Price Low to High") {
      makeSort = { price: +1 };
    } else if (sort === "Price High to Low") {
      makeSort = { price: -1 };
    } else if (sort === "Stock Low to High") {
      makeSort = { Stock: +1 };
    } else if (sort === "Stock High to Low") {
      makeSort = { Stock: -1 };
    } else {
      makeSort = { updatedAt: -1 };
    }

    const searchRegExp = new RegExp(".*" + name + ".*", "i");
    let filter = {};
    if (name !== "" || sort !== "") {
      filter = {
        $or: [{ name: { $regex: searchRegExp } }],
      };
    }

    if (id !== "") {
      filter = {
        _id: id,
      };
    }

    const products = await Product.find(filter)
      .limit(limit)
      .skip((page - 1) * limit)
      .sort(makeSort);

    if (!products) {
      throw createError(400, "Product is not avilable");
    }
    const count = await Product.find(filter).countDocuments();

    res.status(200).json({
      success: true,
      products,
      pagination: {
        number_of_Products: count,
        number_of_product_in_a_page: limit,
        number_of_Pages: Math.ceil(count / limit),
        currentPage: page,
        prevPage: page - 1 > 0 ? page - 1 : null,
        nextPage: page + 1 <= Math.ceil(count / limit) ? page + 1 : null,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.getProduct = async (req, res, next) => {
  try {
    const id = req.params.id;
    const product = await Product.findById(id);
    if (!product) {
      throw createError(400, "Product is not avilable");
    }
    const cate = await Category.findById(product.category);
    product.category = cate.name;
    res.status(200).json({
      success: true,
      product,
    });
  } catch (error) {
    next(error);
  }
};

exports.updateProduct = async (req, res, next) => {
  try {
    const id = req.params.id;
    const product = await Product.findById(id);
    if (!product) {
      throw createError(400, "Product is not find to update");
    }

    let images = [];
    if (typeof req.body.images === "string") {
      images.push(req.body.images);
    } else {
      images = req.body.images;
    }

    if (images !== undefined) {
      for (let i = 0; i < product.images.length; i++) {
        await cloudinary.v2.uploader.destroy(product.images[i].public_id);
      }

      const imagesLinks = [];
      for (let i = 0; i < images.length; i++) {
        const result = await cloudinary.v2.uploader.upload(images[i], {
          folder: "products",
        });
        imagesLinks.push({
          public_id: result.public_id,
          url: result.secure_url,
        });
      }
      req.body.images = imagesLinks;
    }
    req.body.specification = JSON.parse(req.body.specification);
    req.body.updateDate = localTime(0);

    const updateOptions = {
      new: true,
      runValidators: true,
      useFindAndModify: false,
    };

    const updateProduct = await Product.findByIdAndUpdate(
      id,
      req.body,
      updateOptions
    );

    res.status(200).json({
      success: true,
      updateProduct,
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteProduct = async (req, res, next) => {
  try {
    const id = req.params.id;
    const product = await Product.findById(id);
    if (!product) {
      throw createError(401, "product can not find to delete");
    }

    for (let i = 0; i < product.images.length; i++) {
      await cloudinary.v2.uploader.destroy(product.images[i].public_id);
    }

    await Product.findByIdAndDelete(id);
    res.status(200).json({
      success: true,
    });
  } catch (error) {
    next(error);
  }
};

exports.createProductReview = async (req, res, next) => {
  try {
    const { rating, comment, productId, orderId } = req.body;
    const userName = await User.findById(req.user.id);

    const review = {
      order: orderId,
      name: userName.name,
      image: userName?.avatar?.url,
      reviewDate: localTime(0),
      rating: Number(rating),
      comment,
    };

    const product = await Product.findById(productId);

    const isReviewed = product.reviews.find((rev) => rev.order === orderId);

    if (isReviewed) {
      product.reviews.forEach((rev) => {
        if (rev.order === orderId)
          (rev.rating = rating),
            (rev.comment = comment),
            (rev.reviewDate = localTime(0));
      });
    } else {
      product.reviews.push(review);
    }

    product.numOfReviews = product.reviews.length;

    let total = 0;

    product.reviews.forEach((rev) => {
      total += rev.rating;
    });

    product.ratings = total / product.reviews.length;

    await product.save({ validateBeforeSave: false });
    res.status(200).json({
      success: true,
    });
  } catch (error) {
    next(error);
  }
};

exports.getProductReviews = async (req, res, next) => {
  try {
    const product = await Product.findById(req.query.id);

    if (!product) {
      throw createError(404, "Product not found");
    }
    res.status(200).json({
      success: true,
      reviews: product.reviews,
    });
  } catch (error) {
    next(error);
  }
};

// Delete Review
exports.deleteReview = async (req, res, next) => {
  try {
    const product = await Product.findById(req.query.productId);

    if (!product) {
      throw createError(404, "Product not found");
    }

    const reviews = product.reviews.filter(
      (rev) => rev._id.toString() !== req.query.id.toString()
    );

    let total = 0;

    reviews.forEach((rev) => {
      total += rev.rating;
    });

    let ratings = 0;

    if (reviews.length === 0) {
      ratings = 0;
    } else {
      ratings = total / reviews.length;
    }

    const numOfReviews = reviews.length;

    await Product.findByIdAndUpdate(
      req.query.productId,
      {
        reviews,
        ratings,
        numOfReviews,
      },
      {
        new: true,
        useFindAndModify: false,
      }
    );
    res.status(200).json({
      success: true,
      product,
    });
  } catch (error) {
    next(error);
  }
};
