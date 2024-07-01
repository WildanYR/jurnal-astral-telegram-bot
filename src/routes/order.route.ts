import { Router } from "express";
import path from "path";
import { orderGetTitle, orderListAdd } from "../controllers/order.controller";
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

  router.post("/", async (req, res) => {
    await orderListAdd(req.body.data, bot);
    res.json({ status: "OK", message: "ok" });
  });

  return router;
};
