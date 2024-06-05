import TelegramBot from "node-telegram-bot-api";
import { cancelCommandHandle, startCommandHandle } from "../controllers/start.controller";

export const initStartHandler = (bot: TelegramBot) => {
  bot.onText(/\/start/, async (msg) => {
    if (msg.chat.type !== 'private') return

    await startCommandHandle(bot, msg.chat.id, msg.from!.id);
  });

  bot.onText(/\/cancel/, async (msg) => {
    if (msg.chat.type !== 'private') return
    
    await cancelCommandHandle(bot, msg.chat.id, msg.from!.id);
  });
};
