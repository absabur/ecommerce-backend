const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    shippingInfo: {
      address: {
        type: String,
        required: true,
      },
      district: {
        type: String,
        required: true,
      },
      subDistrict: {
        type: String,
        required: true,
      },
      division: {
        type: String,
        required: true,
      },
      phoneNo: {
        type: String,
        required: true,
      },
      email: {
        type: String,
        required: true,
      },
    },
    orderItems: [
      {
        name: {
          type: String,
          required: true,
        },
        price: {
          type: Number,
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
        },
        image: {
          type: String,
          required: true,
        },
        productId: {
          type: mongoose.Schema.ObjectId,
          ref: "Product",
          required: true,
        },
        review: {
          type: String,
          default: "not",
        },
      },
    ],
    user: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: true,
    },
    paymentInfo: {
      way: {
        type: String,
        required: true,
      },
      status: {
        type: String,
        required: true,
      },
      transition: String,
    },
    paidAt: {
      type: Date,
      required: true,
    },
    itemsPrice: {
      type: Number,
      default: 0,
      required: true,
    },
    shippingFee: {
      type: Number,
      default: 0,
      required: true,
    },
    totalPrice: {
      type: Number,
      default: 0,
      required: true,
    },
    orderStatus: {
      type: String,
      default: "processing",
      required: true,
    },
    reason: {
      type: String,
      default: "",
    },
    deliverdAt: Date,
  },
  { timestamps: true }
);

const Order = mongoose.model("Order", orderSchema);

module.exports = Order;
