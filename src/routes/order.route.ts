import { Router } from "express";
import path from "path";
import { orderListAdd } from "../controllers/order.controller";

const router = Router();

router.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "public", "order_app", "index.html"));
});

router.post("/", async (req, res) => {
  await orderListAdd(req.body.data);
  res.json({ status: "OK", message: "ok" });
});

export const orderRouter = router;
