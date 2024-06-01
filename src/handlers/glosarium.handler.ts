import TelegramBot from "node-telegram-bot-api";
import { getGlosariumLink } from "../controllers/glosarium.controller";

export const initGlosariumHandler = (bot: TelegramBot) => {
  bot.onText(/\/glosarium/, async (msg) => {
    await getGlosariumLink(bot, msg.chat.id);
  });
};
