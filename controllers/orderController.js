const Order = require("../models/orderModel");
const createError = require("http-errors");
const Product = require("../models/productModel.js");
const { successResponse } = require("./responseController.js");

exports.newOrder = async (req, res, next) => {
  try {
    const {
      shippingInfo,
      orderItems,
      paymentInfo,
      itemsPrice,
      shippingFee,
      totalPrice,
      orderStatus,
    } = req.body;
    const order = await Order.create({
      shippingInfo,
      orderItems,
      paymentInfo,
      itemsPrice,
      shippingFee,
      totalPrice,
      orderStatus,
      paidAt: Date.now(),
      user: req.user.id,
    });
    res.status(200).json({
      success: true,
      order,
      message: "Order Created",
    });
  } catch (error) {
    next(error);
  }
};

exports.getSingleOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id).populate(
      "user",
      "name email"
    );
    if (!order) {
      throw createError(404, "order not found with this id");
    }
    res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
    next(error);
  }
};

exports.myOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ user: req.user.id });
    res.status(200).json({
      success: true,
      orders,
    });
  } catch (error) {
    next(error);
  }
};

exports.getAllOrders = async (req, res, next) => {
  try {
    const id = req.query.id;
    const sort = req.query.sort;
    let filter = {}
    

    if (sort) {
      filter = {orderStatus: sort}
    }
    if (id) {
      filter= {_id: id}
    }
    if (id == "undefined" && sort == "undefined") {
      filter = {}
    }

    const orders = await Order.find(filter);
    let totalAmount = 0;
    orders.forEach((order) => {
      totalAmount += order.totalPrice;
    });
    res.status(200).json({
      success: true,
      orders,
      totalAmount,
    });
  } catch (error) {
    next(error);
  }
};

exports.updatePaymentStatus = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    const { way, status, transition } = req.body;
    if (!order) {
      throw createError(404, "order not found with this id");
    }

    if (order.orderStatus !== "pay") {
      throw createError(404, "order already on process");
    }

    order.orderStatus = "process";
    order.paymentInfo = {
      way,
      status,
      transition,
    };

    await order.save({ validateBeforeSave: false });
    res.status(200).json({
      success: true,
    });
  } catch (error) {
    next(error);
  }
};

exports.reviewDone = async (req, res, next) => {
  try {
    const order = await Order.findById(req.body.id);

    order.orderItems.map((item) => {
      if (item.productId.toString() === req.body.productId.toString()) {
        item.review = "done";
      }
    });

    await order.save({ validateBeforeSave: false });
    res.status(200).json({
      success: true,
    });
  } catch (error) {
    next(error);
  }
};

exports.updateOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      throw createError(404, "order not found with this id");
    }

    if (order.orderStatus === "delivered") {
      throw createError(404, "order already delivered");
    }

    order.orderStatus = req.body.status;
    if (req.body.status === "delivered") {
      order.deliverdAt = Date.now();
      order.orderItems.forEach(async (item) => {
        await updateStock(item.product, item.quantity);
      });
    }
    await order.save({ validateBeforeSave: false });
    res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
    next(error);
  }
};

async function updateStock(id, quantity) {
  const product = await Product.findById(id);
  product.Stock -= quantity;
  product.sold += quantity;
  await product.save({ validateBeforeSave: false });
}

exports.deleteOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      throw createError(404, "order not found");
    }
    if (order.orderStatus === "delivered") {
      throw createError(401, "order already delivered");
    }
    await Order.findByIdAndDelete(req.params.id);
    res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
    next(error);
  }
};
