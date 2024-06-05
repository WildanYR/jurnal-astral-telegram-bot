import { Router } from "express";
import path from "path";
import { orderListAdd } from "../controllers/order.controller";
import TelegramBot from "node-telegram-bot-api";

export const initOrderRouter = (bot: TelegramBot) => {
  const router = Router();
  
  router.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "..", "public", "order_app", "index.html"));
  });
  
  router.post("/", async (req, res) => {
    await orderListAdd(req.body.data, bot);
    res.json({ status: "OK", message: "ok" });
  });

  return router
}