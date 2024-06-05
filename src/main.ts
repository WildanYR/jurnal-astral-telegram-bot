import dotenv from "dotenv";
dotenv.config();
import express, {
  json as jsonBodyParser,
  static as expressStatic,
} from "express";
import { databaseConfig } from "./configs/database.config";
import { telegramConfig } from "./configs/telegram.config";
import { initDatabase } from "./databases";
import TelegramBot from "node-telegram-bot-api";
import cors from "cors";
import path from "path";
import { appConfig } from "./configs/app.config";
import { glosariumRouter } from "./routes/glosarium.route";
import { initStartHandler } from "./handlers/start.handler";
import { initMessageHandler } from "./handlers/message.handler";
import { initCallbackQueryHandler } from "./handlers/callback_query.handler";
import { initOrderRouter } from "./routes/order.route";
import { initOrderHandler } from "./handlers/order.handler";
import { initGlosariumHandler } from "./handlers/glosarium.handler";
import { initAuthHandler } from "./handlers/auth.handler";

async function main() {
  if (
    !databaseConfig.username ||
    !databaseConfig.password ||
    !databaseConfig.host ||
    !databaseConfig.port ||
    !databaseConfig.dbname ||
    !databaseConfig.dialect
  ) {
    console.error("Database Connection Param Invalid");
    return;
  }
  if (!telegramConfig.token) {
    console.error("Telegram Api Token Invalid");
    return;
  }
  if (!telegramConfig.webhook_uri) {
    console.error("Telegram Bot URI Invalid");
    return;
  }

  initDatabase();

  const telegramBot = new TelegramBot(telegramConfig.token);
  const telegramUpdateRoute = `/bot${telegramConfig.token}`;
  await telegramBot.setWebHook(`${telegramConfig.webhook_uri}${telegramUpdateRoute}`);

  const app = express();

  app.use(cors());
  app.use(jsonBodyParser());

  app.use(expressStatic(path.join(__dirname, "public")));

  app.get("/", (req, res) => {
    res.send("Jurnal Astral Telegram Bot");
  });

  app.post(`${telegramUpdateRoute}`, (req, res) => {
    telegramBot.processUpdate(req.body);
    res.sendStatus(200);
  });

  app.use("/glosarium", glosariumRouter);

  const orderRouter = initOrderRouter(telegramBot)
  app.use("/order", orderRouter);

  app.listen(appConfig.port);

  initMessageHandler(telegramBot);
  initCallbackQueryHandler(telegramBot);
  initStartHandler(telegramBot);
  initOrderHandler(telegramBot);
  initGlosariumHandler(telegramBot);
  initAuthHandler(telegramBot);

  console.log(`App Ready, Listening on port ${appConfig.port}`)
}

main();
