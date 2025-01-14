import TelegramBot from "node-telegram-bot-api";
import { orderConst } from "../constants/order.const";
import {
  orderCreateInit,
  orderCreateSetCategory,
  orderGetResult,
} from "../controllers/order.controller";
import { glosariumConst } from "../constants/glosarium.const";
import { getGlosariumLink } from "../controllers/glosarium.controller";
import { getChatInstance } from "../utils/chat_instance.util";
import { OrderCategory } from "../types/order_category.type";

export const initCallbackQueryHandler = (bot: TelegramBot) => {
  bot.on("callback_query", async (msg) => {
    if (msg.data) {
      const callbackData = msg.data.split(";");

      if (callbackData[0] === glosariumConst.callbackData.OPEN) {
        await getGlosariumLink(bot, parseInt(callbackData[1]));
      }

      if (callbackData[0] === orderConst.callbackData.CREATE) {
        await orderCreateInit(
          bot,
          parseInt(callbackData[1]),
          parseInt(callbackData[2])
        );
      }

      if (callbackData[0] === orderConst.callbackData.CATEGORY) {
        const chat_id = parseInt(callbackData[1]);
        const user_id = parseInt(callbackData[2]);

        const chatInstance = await getChatInstance(chat_id, user_id);

        if (chatInstance.state === orderConst.state.GET_CATEGORY) {
          await orderCreateSetCategory(
            bot,
            chat_id,
            user_id,
            callbackData[3] as OrderCategory
          );
        }
      }

      if (callbackData[0] === orderConst.callbackData.GET_RESULT) {
        await orderGetResult(
          bot,
          parseInt(callbackData[1]),
          parseInt(callbackData[2])
        );
      }
    }

    await bot.answerCallbackQuery(msg.id);
  });
};
