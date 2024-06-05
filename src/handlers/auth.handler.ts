import TelegramBot from "node-telegram-bot-api";
import { authInit, logout } from "../controllers/auth.controller";

export const initAuthHandler = (bot: TelegramBot) => {
  bot.onText(/\/auth/, async (msg) => {
    if (msg.chat.type !== 'private') return

    await authInit(bot, msg.chat.id, msg.from!.id);
  });

  bot.onText(/\/logout/, async (msg) => {
    if (msg.chat.type !== 'private') return

    await logout(bot, msg.chat.id, msg.from!.id);
  });
};
