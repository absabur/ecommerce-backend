const express = require("express");
const { isLoggedIn, isAdmin } = require("../middleware/auth");
const { newOrder, myOrders, getSingleOrder, getAllOrders, updateOrder, deleteOrder, updatePaymentStatus, reviewStatusChange, reviewDone, cancelOrder } = require("../controllers/orderController");

const orderRouter = express.Router()


orderRouter.post("/new", isLoggedIn, newOrder);

orderRouter.get("/:id([0-9a-fA-F]{24})",isLoggedIn, getSingleOrder);

orderRouter.put("/update-payment/:id([0-9a-fA-F]{24})",isLoggedIn, updatePaymentStatus);

orderRouter.put("/reviewd", isLoggedIn, reviewDone);

orderRouter.get("/my-orders", isLoggedIn, myOrders);

orderRouter.get("/all-orders", isLoggedIn, isAdmin, getAllOrders);

orderRouter.put("/cancel/:id([0-9a-fA-F]{24})", isLoggedIn, cancelOrder);

orderRouter.put("/:id([0-9a-fA-F]{24})", isLoggedIn, isAdmin, updateOrder);

orderRouter.delete("/:id([0-9a-fA-F]{24})", isLoggedIn, isAdmin, deleteOrder);


module.exports = orderRouter;