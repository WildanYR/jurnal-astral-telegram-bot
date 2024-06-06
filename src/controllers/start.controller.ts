import TelegramBot from "node-telegram-bot-api";
import { getChatInstance, setChatInstanceState } from "../utils/chat_instance.util";
import { orderConst } from "../constants/order.const";
import { glosariumConst } from "../constants/glosarium.const";
import { botConst } from "../constants/bot.const";

export const startCommandHandle = async (
  bot: TelegramBot,
  chat_id: number,
  user_id: number,
  chat_thread_id?: number
) => {
  await getChatInstance(chat_id, user_id);
  await bot.sendMessage(chat_id, "Selamat datang di Jurnal Astral Bot", {
    message_thread_id: chat_thread_id,
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
            text: "Buat Presensi Kegiatan",
            callback_data: `${orderConst.callbackData.CREATE};${chat_id};${user_id}`,
          },
        ],
      ],
    },
  });
};

export const cancelCommandHandle = async (bot: TelegramBot, chat_id: number, user_id: number) => {
  const chatInstance = await getChatInstance(chat_id, user_id)
  if (chatInstance.state === botConst.state.START) {
    await bot.sendMessage(chat_id, 'tidak ada aksi yang dilakukan')
    return
  }
  await setChatInstanceState(chat_id, user_id, botConst.state.START)
  await bot.sendMessage(chat_id, 'Aksi dibatalkan')
}