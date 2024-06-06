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
import { OrderChatUpdate } from "../databases/models/order_chat_update.model";

let timer_id: NodeJS.Timeout

const getOrderAppLink = (order_id: number, title: string) => {
  const payload = encodeText(`${order_id}|${title}`);
  return `${telegramConfig.uri}/${orderConst.webAppName}?startapp=${payload}`;
};

export const orderCreateInit = async (
  bot: TelegramBot,
  chat_id: number,
  user_id: number
) => {
  await bot.sendMessage(chat_id, "Masukkan Nama Kegiatan:\nmisal: Dragon Ring 01 Januari 1999");
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
      `Anda dapat membagikan hasil list dengan command\n\n<strong>Data List Terbaru</strong>\n<code>/orderresult_${order.id}</code>\n<code>/orderresult_${order.id}@${telegramConfig.username}</code> untuk grup\n\n<strong>Auto Update Data</strong>\n<code>/orderresultrt_${order.id}</code>\n<code>/orderresultrt_${order.id}@${telegramConfig.username}</code> untuk grup\n\nNote kirim ke grup:\n- bot harus menjadi member dari grup\n- Hanya yang sudah login sebagai Admin dari bot ini /auth yang bisa mengirim ke grup`,
      { parse_mode: "HTML" }
    );

    await orderAddResultListener(bot, chat_id, order.id);

    await transaction.commit();
  } catch (error: any) {
    await transaction.rollback();
    console.error(error);
  }
};

export const orderGetResultText = async (order_id: number) => {
  const order = await Order.findOne({
    where: { id: order_id },
    include: [{ model: OrderList, as: "order_list" }],
  });

  if (!order) {
    return '';
  }

  const timeStr = new Date()
    .toLocaleString("id-ID", { timeZone: "Asia/Jakarta" })
    .split(", ")[1]
    .substring(0, 5);
  let order_list_text = `<blockquote>update ${timeStr} WIB</blockquote>\n<strong>Daftar Peserta ${order.name}</strong>\n\n`;
  let count = 1;

  if (order.order_list.length) {
    for (const list of order.order_list) {
      order_list_text += `${count}. ${list.value}\n`;
      count++;
    }
  } else {
    order_list_text += '<i>Belum Ada Peserta</i>'
  }

  const orderAppLink = getOrderAppLink(order.id, order.name);
  return `${order_list_text}\n\nLink Pendaftaran:\n${orderAppLink}`
}

export const orderGetResult = async (
  bot: TelegramBot,
  chat_id: number,
  order_id?: number,
  chat_thread_id?: number
) => {
  if (!order_id) {
    await bot.sendMessage(chat_id, "Order Id Invalid", {
      message_thread_id: chat_thread_id,
    });
    return
  }

  const orderResultText = await orderGetResultText(order_id);
  if (!orderResultText) {
    await bot.sendMessage(chat_id, "List tidak ditemukan", {
      message_thread_id: chat_thread_id,
    });
    return;
  }

  const listMsg = await bot.sendMessage(
    chat_id,
    orderResultText,
    { parse_mode: "HTML", message_thread_id: chat_thread_id }
  );
  return listMsg.message_id;
};

export const orderAddResultListener = async (
  bot: TelegramBot,
  chat_id: number,
  order_id?: number,
  chat_thread_id?: number,
  command_message_id?: number
) => {
  if (!order_id) {
    await bot.sendMessage(chat_id, "Order Id Invalid", {
      message_thread_id: chat_thread_id,
    });
    return
  }

  let condition: any = {chat_id, order_id}
  if (chat_thread_id) {
    condition.chat_thread_id = chat_thread_id
  }

  const orderChatUpdate = await OrderChatUpdate.findOne({where: condition})
  if (orderChatUpdate) {
    await bot.sendMessage(chat_id, '<strong>Hasil akan otomatis di update setiap ada yang mendaftar</strong>', {parse_mode: 'HTML', message_thread_id: chat_thread_id})
    if (command_message_id) {
      try {
        await bot.deleteMessage(chat_id, command_message_id)
      } catch (error: any) {
        console.log('Error ', error.toString())
      }
    }
    return
  }

  await bot.sendMessage(chat_id, '<strong>Hasil akan otomatis di update setiap ada yang mendaftar</strong>', {parse_mode: 'HTML', message_thread_id: chat_thread_id})

  const resultMsgId = await orderGetResult(
    bot,
    chat_id,
    order_id,
    chat_thread_id
  );
  await OrderChatUpdate.create({
    chat_id,
    order_id,
    chat_thread_id,
    previous_message_id: resultMsgId,
  });
  if (command_message_id) {
    try {
      await bot.deleteMessage(chat_id, command_message_id)
    } catch (error: any) {
      console.log('Error ', error.toString())
    }
  }
};

export const orderListAdd = async (data: ICreateOrderList[], bot: TelegramBot) => {
  if (!data.length) return

  await OrderList.bulkCreate(data);

  const order_id = data[0].order_id

  if (timer_id) clearTimeout(timer_id);

  timer_id = setTimeout(async () => {
    const orderUpdate = await OrderChatUpdate.findAll({where: {order_id}})

    if (!orderUpdate.length) return

    const orderResultText = await orderGetResultText(order_id)

    if (!orderResultText) return

    for (const update of orderUpdate) {
      const lastMsg = await bot.sendMessage(
        update.chat_id,
        orderResultText,
        { parse_mode: "HTML", message_thread_id: update.chat_thread_id }
      );
      if (update.previous_message_id) {
        try {
          await bot.deleteMessage(update.chat_id, update.previous_message_id)
        } catch (error: any) {
          console.log('Error ', error.toString())
        }
      }
      await update.update({'previous_message_id': lastMsg.message_id})
    }

  }, 60000)
};

export const orderStopResultListener = async (
  bot: TelegramBot,
  chat_id: number,
  order_id?: number,
  chat_thread_id?: number,
  command_message_id?: number
) => {
  if (!order_id) {
    await bot.sendMessage(chat_id, "Order Id Invalid", {
      message_thread_id: chat_thread_id,
    });
    return
  }

  let condition: any = {chat_id, order_id}
  if (chat_thread_id) {
    condition.chat_thread_id = chat_thread_id
  }

  const orderChatUpdate = await OrderChatUpdate.findOne({where: condition})

  if (orderChatUpdate) {
    await orderChatUpdate.destroy()
    await bot.sendMessage(chat_id, 'Pendaftaran selesai ditampilkan secara langsung', {message_thread_id: chat_thread_id})
  }

  if (command_message_id) {
    try {
      await bot.deleteMessage(chat_id, command_message_id)
    } catch (error: any) {
      console.log('Error ', error.toString())
    }
  }

}