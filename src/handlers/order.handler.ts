import TelegramBot from "node-telegram-bot-api";
import {
  orderAddResultListener,
  orderCreateInit,
  orderGetResult,
  orderStopResultListener,
} from "../controllers/order.controller";

export const initOrderHandler = (bot: TelegramBot) => {
  bot.onText(/\/ordercreate/, async (msg) => {
    await orderCreateInit(bot, msg.chat.id, msg.from!.id);
  });

  bot.onText(/\/orderresult (.+)/, async (msg, matches) => {
    await orderGetResult(
      bot,
      msg.chat.id,
      matches ? parseInt(matches[1]) : undefined,
      msg.message_thread_id
    );
  });

  bot.onText(/\/orderresultrt (.+)/, async (msg, matches) => {
    await orderAddResultListener(
      bot,
      msg.chat.id,
      matches ? parseInt(matches[1]) : undefined,
      msg.message_thread_id,
      msg.message_id
    );
  });

  bot.onText(/\/orderresultrtstop (.+)/, async (msg, matches) => {
    await orderStopResultListener(
      bot,
      msg.chat.id,
      matches ? parseInt(matches[1]) : undefined,
      msg.message_thread_id,
      msg.message_id
    );
  });
};
