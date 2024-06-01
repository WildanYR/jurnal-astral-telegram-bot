import TelegramBot from "node-telegram-bot-api";
import { startCommandHandle } from "../controllers/start.controller";

export const initStartHandler = (bot: TelegramBot) => {
  bot.onText(/\/start/, async (msg) => {
    await startCommandHandle(bot, msg.chat.id, msg.from!.id);
  });
};
