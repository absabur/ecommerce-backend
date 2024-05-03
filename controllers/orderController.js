const Order = require("../models/orderModel");
const createError = require("http-errors");
const Product = require("../models/productModel.js");
const sendEmailWithNode = require("../utils/mailSender");
const { localTime } = require("../utils/localTime");
const User = require("../models/userModel")

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
      createDate: await localTime(0),
      updateDate: await localTime(0),
      user: req.user.id,
    });
    const user = await User.findById(req.user.id)
    const emailData = {
      email: shippingInfo.email,
      subject: "Order Success",
      html: `
            <div style="background-color: rgba(175, 175, 175, 0.455); width: 100%; min-width: 350px; padding: 1rem; box-sizing: border-box;">
              <p style="font-size: 25px; font-weight: 500; text-align: center; color: tomato;">ABS E-Commerce</p>
              <h2 style="font-size: 30px; font-weight: 700; text-align: center; color: green;">Hello ${user.name}</h2>
              <p style="font-size: 20px; font-weight: 500; text-align: center; color: tomato;">Order Successfull</p>
              <p style="margin: 0 auto; font-size: 22px; font-weight: 500; text-align: center; color: black;">Your order is placed.<br />You can cancel order before ship.</p>
              <p style="text-align: center;">
                <a style="margin: 0 auto; text-align: center; background-color: #34eb34; font-size: 25px; box-shadow: 0 0 5px black; color: black; font-weight: 700; padding: 5px 10px; text-decoration: none;" href="${process.env.clientUrl}/myorders" target="_blank">Click Here </a>
              </p>
              <p style="text-align: center; font-size: 18px; color: black;">to Show Your Orders </p>
            </div>
          `,
    };

    try {
      await sendEmailWithNode(emailData);
    } catch (error) {
      throw createError(500, "Failed to send order Confirmation email.");
    }
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
      throw createError(404, "Order not found with this id");
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
    let id = req.query.id;
    let sort = req.query.sort;
    if (id === "null") {
      id = "";
    }
    if (sort === "null") {
      sort = "";
    }
    let filter = {};

    if (sort) {
      filter = { orderStatus: sort };
    }
    if (id) {
      filter = { _id: id };
    }
    if (id == "undefined" && sort == "undefined") {
      filter = {};
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
      throw createError(404, "Order not found with this id");
    }

    if (order.orderStatus !== "pay") {
      throw createError(404, "order already on process");
    }

    order.orderStatus = "processing";
    order.paymentInfo = {
      way,
      status,
      transition,
    };
    order.paidAt = await localTime(0);

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

exports.cancelOrder = async (req, res, next) => {
  try {
    const reason = req.body.reason;
    const order = await Order.findById(req.params.id);
    if (!order) {
      throw createError(404, "Order not found with this id");
    }

    if (order.orderStatus === "shipping") {
      throw createError(404, "Can't Cancel, Already Shiping");
    }
    if (order.orderStatus === "receive") {
      throw createError(404, "Can't Cancel, Already Reached");
    }

    order.orderStatus = "canceled";
    order.reason = reason;
    order.updateDate = await localTime(0);

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
    const reason = req.body.reason;
    const order = await Order.findById(req.params.id);
    if (!order) {
      throw createError(404, "Order not found with this id");
    }

    if (order.orderStatus === "delivered") {
      throw createError(404, "Order already Delivered, No Access");
    }
    if (order.orderStatus === "canceled") {
      throw createError(404, "Order already Canceled, No Access");
    }

    if (reason) {
      order.reason = reason;
    } else {
      order.reason = "";
    }

    if (
      (req.body.status === "canceled" && order.orderStatus === "shipping") ||
      order.orderStatus === "receive"
    ) {
      order.orderItems.forEach(async (item) => {
        await updateStockIncrease(item.productId, item.quantity);
      });
    }
    order.orderStatus = req.body.status;
    if (req.body.status === "shipping") {
      order.orderItems.forEach(async (item) => {
        await updateStock(item.productId, item.quantity);
      });
    }
    if (req.body.status === "delivered") {
      order.deliverdAt = await localTime(0);
      order.orderItems.forEach(async (item) => {
        await updateSold(item.productId, item.quantity);
      });
    }
    order.updateDate = await localTime(0);
    await order.save({ validateBeforeSave: false });
    if (req.body.status === "shipping") {
      const user = await User.findById(req.user.id)
      const emailData = {
        email: order?.shippingInfo?.email,
        subject: "Order Shipping",
        html: `
            <div style="background-color: rgba(175, 175, 175, 0.455); width: 100%; min-width: 350px; padding: 1rem; box-sizing: border-box;">
              <p style="font-size: 25px; font-weight: 500; text-align: center; color: tomato;">ABS E-Commerce</p>
              <h2 style="font-size: 30px; font-weight: 700; text-align: center; color: green;">Hello ${user?.name}</h2>
              <p style="font-size: 20px; font-weight: 500; text-align: center; color: tomato;">Order Shipping</p>
              <p style="margin: 0 auto; font-size: 22px; font-weight: 500; text-align: center; color: black;">Your order is Shipped, It is on the way to delivery</p>
              <p style="text-align: center;">
                <a style="margin: 0 auto; text-align: center; background-color: #34eb34; font-size: 25px; box-shadow: 0 0 5px black; color: black; font-weight: 700; padding: 5px 10px; text-decoration: none;" href="${process.env.clientUrl}/myorders/to-ship" target="_blank">Click Here </a>
              </p>
              <p style="text-align: center; font-size: 18px; color: black;">to Show Your Order</p>
            </div>
          `,
      };

      try {
        await sendEmailWithNode(emailData);
      } catch (error) {
        throw createError(500, "Failed to send order Confirmation email.");
      }
    }
    if (req.body.status === "receive") {
      const user = await User.findById(req.user.id)
      const emailData = {
        email: order?.shippingInfo?.email,
        subject: "Order Reached",
        html: `
              <div style="background-color: rgba(175, 175, 175, 0.455); width: 100%; min-width: 350px; padding: 1rem; box-sizing: border-box;">
                <p style="font-size: 25px; font-weight: 500; text-align: center; color: tomato;">ABS E-Commerce</p>
                <h2 style="font-size: 30px; font-weight: 700; text-align: center; color: green;">Hello ${user?.name}</h2>
                <p style="font-size: 20px; font-weight: 500; text-align: center; color: tomato;">Order Reached to Local Area</p>
                <p style="margin: 0 auto; font-size: 22px; font-weight: 500; text-align: center; color: black;">Your order is reached to your local area, It is on the way to delivery.</p>
                <p style="text-align: center;">
                  <a style="margin: 0 auto; text-align: center; background-color: #34eb34; font-size: 25px; box-shadow: 0 0 5px black; color: black; font-weight: 700; padding: 5px 10px; text-decoration: none;" href="${process.env.clientUrl}/myorders/to-receive" target="_blank">Click Here </a>
                </p>
                <p style="text-align: center; font-size: 18px; color: black;">to Show Your Order</p>
              </div>
            `,
      };

      try {
        await sendEmailWithNode(emailData);
      } catch (error) {
        throw createError(500, "Failed to send order Confirmation email.");
      }
    }
    if (req.body.status === "delivered") {
      const user = await User.findById(req.user.id)
      const emailData = {
        email: order?.shippingInfo?.email,
        subject: "Order Delivered",
        html: `
              <div style="background-color: rgba(175, 175, 175, 0.455); width: 100%; min-width: 350px; padding: 1rem; box-sizing: border-box;">
                <p style="font-size: 25px; font-weight: 500; text-align: center; color: tomato;">ABS E-Commerce</p>
                <h2 style="font-size: 30px; font-weight: 700; text-align: center; color: green;">Hello ${user?.name}</h2>
                <p style="font-size: 20px; font-weight: 500; text-align: center; color: tomato;">Order Delivered</p>
                <p style="margin: 0 auto; font-size: 22px; font-weight: 500; text-align: center; color: black;">Leave a review to share the experience with us.</p>
                <p style="text-align: center;">
                  <a style="margin: 0 auto; text-align: center; background-color: #34eb34; font-size: 25px; box-shadow: 0 0 5px black; color: black; font-weight: 700; padding: 5px 10px; text-decoration: none;" href="${process.env.clientUrl}/myorders/to-review" target="_blank">Click Here </a>
                </p>
                <p style="text-align: center; font-size: 18px; color: black;">to Review Order</p>
              </div>
            `,
      };

      try {
        await sendEmailWithNode(emailData);
      } catch (error) {
        throw createError(500, "Failed to send order Confirmation email.");
      }
    }

    if (req.body.status === "canceled") {
      const user = await User.findById(req.user.id)
      const emailData = {
        email: order?.shippingInfo?.email,
        subject: "Order Canceled",
        html: `
              <div style="background-color: rgba(175, 175, 175, 0.455); width: 100%; min-width: 350px; padding: 1rem; box-sizing: border-box;">
                <p style="font-size: 25px; font-weight: 500; text-align: center; color: tomato;">ABS E-Commerce</p>
                <h2 style="font-size: 30px; font-weight: 700; text-align: center; color: green;">Hello ${user?.name}</h2>
                <p style="font-size: 20px; font-weight: 500; text-align: center; color: tomato;">Order Canceled</p>
                <p style="margin: 0 auto; font-size: 22px; font-weight: 500; text-align: center; color: black;">Your order was canceled due to ${order.reason}</p>
                <p style="text-align: center;">
                  <a style="margin: 0 auto; text-align: center; background-color: #34eb34; font-size: 25px; box-shadow: 0 0 5px black; color: black; font-weight: 700; padding: 5px 10px; text-decoration: none;" href="${process.env.clientUrl}/order/${order._id}" target="_blank">Click Here </a>
                </p>
                <p style="text-align: center; font-size: 18px; color: black;">to See Order Details</p>
              </div>
            `,
      };

      try {
        await sendEmailWithNode(emailData);
      } catch (error) {
        throw createError(500, "Failed to send order Confirmation email.");
      }
    }
    res.status(200).json({
      success: true,
    });
  } catch (error) {
    next(error);
  }
};

async function updateStockIncrease(id, quantity) {
  const product = await Product.findById(id);
  if (!product) return;
  product.Stock += quantity;
  await product.save({ validateBeforeSave: false });
}

async function updateStock(id, quantity) {
  const product = await Product.findById(id);
  if (!product) return;
  if (product.Stock <= quantity) {
    product.Stock = 0;
  } else {
    product.Stock -= quantity;
  }
  await product.save({ validateBeforeSave: false });
}
async function updateSold(id, quantity) {
  const product = await Product.findById(id);
  if (!product) return;
  product.sold += quantity;
  await product.save({ validateBeforeSave: false });
}

exports.deleteOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      throw createError(404, "Order not found");
    }
    if (order.orderStatus !== "canceled") {
      throw createError(401, "Cancel Order to Delete");
    }
    await Order.findByIdAndDelete(req.params.id);
    res.status(200).json({
      success: true,
    });
  } catch (error) {
    next(error);
  }
};
