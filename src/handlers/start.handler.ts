import TelegramBot from "node-telegram-bot-api";
import {
  cancelCommandHandle,
  startCommandHandle,
} from "../controllers/start.controller";
import { getChatInstance } from "../utils/chat_instance.util";
import { orderConst } from "../constants/order.const";
import { orderCreateDescEmpty } from "../controllers/order.controller";

export const initStartHandler = (bot: TelegramBot) => {
  bot.onText(/\/start/, async (msg) => {
    if (msg.chat.type !== "private") return;

    await startCommandHandle(bot, msg.chat.id, msg.from!.id);
  });

  bot.onText(/\/cancel/, async (msg) => {
    if (msg.chat.type !== "private") return;

    await cancelCommandHandle(bot, msg.chat.id, msg.from!.id);
  });

  bot.onText(/\/empty/, async (msg) => {
    if (msg.chat.type !== "private") return;
    const chat_id = msg.chat.id;
    const user_id = msg.from!.id;

    const chatIsntance = await getChatInstance(chat_id, user_id);

    if (chatIsntance.state === orderConst.state.GET_DESCRIPTION) {
      await orderCreateDescEmpty(bot, chat_id, user_id);
    }
  });
};
