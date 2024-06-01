import TelegramBot from "node-telegram-bot-api";
import {
  orderCreateInit,
  orderGetResult,
} from "../controllers/order.controller";

export const initOrderHandler = (bot: TelegramBot) => {
  bot.onText(/\/ordercreate/, async (msg) => {
    await orderCreateInit(bot, msg.chat.id, msg.from!.id);
  });

  bot.onText(/\/orderresult (.+)/, async (msg, matches) => {
    await orderGetResult(
      bot,
      msg.chat.id,
      matches ? parseInt(matches[1]) : undefined
    );
  });
};
