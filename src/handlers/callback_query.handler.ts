import TelegramBot from "node-telegram-bot-api";
import { orderConst } from "../constants/order.const";
import {
  orderCreateInit,
  orderGetResult,
} from "../controllers/order.controller";
import { glosariumConst } from "../constants/glosarium.const";
import { getGlosariumLink } from "../controllers/glosarium.controller";

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
