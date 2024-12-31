import TelegramBot from "node-telegram-bot-api";
import { getChatInstance } from "../utils/chat_instance.util";
import { appConfig } from "../configs/app.config";
import { orderConst } from "../constants/order.const";
import {
  orderCreateSetDesc,
  orderCreateSetTitle,
  orderSortAvallonDone,
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

      if (chatInstance.state === orderConst.state.GET_AVALLON_ORDER) {
        const noSpaceStr = msg.text!.replace(/\s/g, "");
        let isError = false;
        if (noSpaceStr.includes(",")) {
          try {
            const avallonIdx = noSpaceStr
              .split(",")
              .map((idx) => parseInt(idx));
            await orderSortAvallonDone(bot, chat_id, user_id, avallonIdx);
          } catch (error) {
            isError = true;
          }
        } else {
          isError = true;
        }

        if (isError) {
          await bot.sendMessage(
            chat_id,
            "Format nomor Avallon tidak sesuai, gunakan angka dipisahkan koma (,) tanpa spasi\n\ncontoh: 1,3,5,8,14"
          );
        }
      }
    }
  });
};
