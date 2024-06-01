import TelegramBot from "node-telegram-bot-api";
import { getChatInstance } from "../utils/chat_instance.util";
import { orderConst } from "../constants/order.const";
import { glosariumConst } from "../constants/glosarium.const";

export const startCommandHandle = async (
  bot: TelegramBot,
  chat_id: number,
  user_id: number
) => {
  await getChatInstance(chat_id, user_id);
  await bot.sendMessage(chat_id, "Selamat datang di Jurnal Astral Bot", {
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: "Glosarium",
            callback_data: `${glosariumConst.callbackData.OPEN};${chat_id}`,
          },
        ],
        [
          {
            text: "Buat List Peserta Kegiatan",
            callback_data: `${orderConst.callbackData.CREATE};${chat_id};${user_id}`,
          },
        ],
      ],
    },
  });
};
