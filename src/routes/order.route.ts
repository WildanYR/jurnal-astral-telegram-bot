import { Router } from "express";
import path from "path";
import {
  orderGetTitle,
  orderListAdd,
  orderUserCancel,
  orderUserGetData,
  orderUserUpdateData,
} from "../controllers/order.controller";
import TelegramBot from "node-telegram-bot-api";

export const initOrderRouter = (bot: TelegramBot) => {
  const router = Router();

  router.get("/", (req, res) => {
    res.sendFile(
      path.join(__dirname, "..", "public", "order_app", "index.html")
    );
  });

  router.get("/:id/title", async (req, res) => {
    const order = await orderGetTitle(parseInt(req.params.id));

    if (order.error) {
      res.status(400).json(order);
      return;
    }

    res.json(order);
  });

  router.get("/:id/list/:userId", async (req, res) => {
    const orders = await orderUserGetData(
      parseInt(req.params.id),
      parseInt(req.params.userId)
    );
    res.json(orders);
  });

  router.get("/:id/cancel/:userId", async (req, res) => {
    await orderUserCancel(
      bot,
      parseInt(req.params.id),
      parseInt(req.params.userId)
    );
    res.json({ status: "OK", message: "ok" });
  });

  router.post("/", async (req, res) => {
    await orderListAdd(req.body.data, bot);
    res.json({ status: "OK", message: "ok" });
  });

  router.post("/:id", async (req, res) => {
    await orderUserUpdateData(bot, parseInt(req.params.id), req.body);
    res.json({ status: "OK", message: "ok" });
  });

  return router;
};
