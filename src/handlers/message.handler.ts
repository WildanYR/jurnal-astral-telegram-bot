import TelegramBot from "node-telegram-bot-api";
import { getChatInstance } from "../utils/chat_instance.util";
import { appConfig } from "../configs/app.config";
import { orderConst } from "../constants/order.const";
import {
  orderCreateSetDesc,
  orderCreateSetTitle,
} from "../controllers/order.controller";
import { authConst } from "../constants/auth.const";
import { authValidate } from "../controllers/auth.controller";

export const initMessageHandler = (bot: TelegramBot) => {
  bot.on("message", async (msg) => {
    if (!appConfig.isProduction) {
      console.log("------ Update ------");
      console.log(JSON.stringify(msg, null, 2));
      console.log("------ End Update ------");
    }

    const chat_id = msg.chat.id;

    if (msg.text?.charAt(0) === "/") return;

    if (msg.from) {
      const user_id = msg.from.id;
      const chatInstance = await getChatInstance(chat_id, user_id);

      if (chatInstance.state === authConst.state.GET_TOKEN) {
        await authValidate(bot, chat_id, user_id, msg.text!);
      }

      if (chatInstance.state === orderConst.state.GET_TITLE) {
        await orderCreateSetTitle(bot, chat_id, user_id, msg.text!);
      }

      if (chatInstance.state === orderConst.state.GET_DESCRIPTION) {
        await orderCreateSetDesc(bot, chat_id, user_id, msg.text!);
      }
    }
  });
};
