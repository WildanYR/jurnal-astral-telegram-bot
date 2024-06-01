import TelegramBot from "node-telegram-bot-api";
import { OrderList } from "../databases/models/order_list.model";
import { ICreateOrderList } from "../types/order_list_create.type";
import { setChatInstanceState } from "../utils/chat_instance.util";
import { orderConst } from "../constants/order.const";
import { Order } from "../databases/models/order.model";
import { sequelize } from "../databases";
import { botConst } from "../constants/bot.const";
import { encodeText } from "../utils/text.util";
import { telegramConfig } from "../configs/telegram.config";

const getOrderAppLink = (order_id: number, title: string) => {
  const payload = encodeText(`${order_id}|${title}`);
  return `${telegramConfig.uri}/${orderConst.webAppName}?startapp=${payload}`;
};

export const orderCreateInit = async (
  bot: TelegramBot,
  chat_id: number,
  user_id: number
) => {
  await bot.sendMessage(chat_id, "Masukkan Judul List:");
  await setChatInstanceState(chat_id, user_id, orderConst.state.GET_TITLE);
};

export const orderCreateSetTitle = async (
  bot: TelegramBot,
  chat_id: number,
  user_id: number,
  title: string
) => {
  const transaction = await sequelize.transaction();
  try {
    await setChatInstanceState(
      chat_id,
      user_id,
      botConst.state.START,
      transaction
    );
    const order = await Order.create({ name: title });

    await bot.sendMessage(
      chat_id,
      `${title} berhasil dibuat\n\nShare link dibawah untuk pendaftaran`,
      {
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "Lihat Hasil",
                callback_data: `${orderConst.callbackData.GET_RESULT};${chat_id};${order.id}`,
              },
            ],
          ],
        },
      }
    );

    const orderAppLink = getOrderAppLink(order.id, title);
    await bot.sendMessage(chat_id, orderAppLink);

    await bot.sendMessage(
      chat_id,
      `Hasil List dapat dilihat dengan command\n\n<code>/orderresult ${
        order.id
      }</code>\n\natau dengan link dibawah\n\n${
        telegramConfig.uri
      }?text=${encodeURIComponent(`/orderresult ${order.id}`)}`,
      { parse_mode: "HTML" }
    );

    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    console.error(error);
  }
};

export const orderGetResult = async (
  bot: TelegramBot,
  chat_id: number,
  order_id?: number
) => {
  if (!order_id) {
    await bot.sendMessage(chat_id, "Order Id Invalid");
  }

  const order = await Order.findOne({
    where: { id: order_id },
    include: [{ model: OrderList, as: "order_list" }],
  });

  if (!order) {
    await bot.sendMessage(chat_id, "List tidak ditemukan");
    return;
  }

  const timeStr = new Date()
    .toLocaleString("id-ID", { timeZone: "Asia/Jakarta" })
    .split(", ")[1]
    .substring(0, 5);
  let order_list_text = `<blockquote>update ${timeStr} WIB</blockquote>\n<strong>Daftar Peserta ${order.name}</strong>\n\n`;
  let count = 1;

  for (const list of order.order_list) {
    order_list_text += `${count}. ${list.value}\n`;
    count++;
  }

  const orderAppLink = getOrderAppLink(order.id, order.name);
  await bot.sendMessage(
    chat_id,
    `${order_list_text}\n\nLink Pendaftaran:\n${orderAppLink}`,
    { parse_mode: "HTML" }
  );
};

export const orderListAdd = async (data: ICreateOrderList[]) => {
  await OrderList.bulkCreate(data);
};
