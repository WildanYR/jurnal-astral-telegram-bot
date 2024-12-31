import TelegramBot from "node-telegram-bot-api";
import { OrderList } from "../databases/models/order_list.model";
import { ICreateOrderList } from "../types/order_list_create.type";
import {
  getChatInstance,
  setChatInstanceState,
} from "../utils/chat_instance.util";
import { orderConst } from "../constants/order.const";
import { Order } from "../databases/models/order.model";
import { botConst } from "../constants/bot.const";
import { encodeText } from "../utils/text.util";
import { telegramConfig } from "../configs/telegram.config";
import { OrderChatUpdate } from "../databases/models/order_chat_update.model";

let timer_id: NodeJS.Timeout;

const getOrderAppLink = (order_id: number) => {
  const payload = encodeText(`${order_id}`);
  return `${telegramConfig.uri}/${orderConst.webAppName}?startapp=${payload}`;
};

export const orderCreateInit = async (
  bot: TelegramBot,
  chat_id: number,
  user_id: number
) => {
  await setChatInstanceState(chat_id, user_id, orderConst.state.GET_TITLE);
  await bot.sendMessage(
    chat_id,
    "Masukkan Nama Kegiatan:\nmisal: Dragon Ring 01 Januari 1999"
  );
};

export const orderCreateSetTitle = async (
  bot: TelegramBot,
  chat_id: number,
  user_id: number,
  title: string
) => {
  const order = await Order.create({ name: title });
  await setChatInstanceState(
    chat_id,
    user_id,
    orderConst.state.GET_DESCRIPTION,
    { metadata: order.id.toString() }
  );
  await bot.sendMessage(
    chat_id,
    `Masukkan deskripsi kegiatan?\n\nmasukkan /empty jika tanpa deskripsi`
  );
};

export const orderCreateSetDesc = async (
  bot: TelegramBot,
  chat_id: number,
  user_id: number,
  description: string
) => {
  const chatInstance = await getChatInstance(chat_id, user_id);
  await Order.update(
    { description },
    { where: { id: parseInt(chatInstance.metadata) } }
  );
  await orderCreateDone(bot, chat_id, user_id);
};

export const orderCreateDescEmpty = async (
  bot: TelegramBot,
  chat_id: number,
  user_id: number
) => {
  const chatInstance = await getChatInstance(chat_id, user_id);
  if (chatInstance.state === orderConst.state.GET_DESCRIPTION) {
    await orderCreateDone(bot, chat_id, user_id);
  } else {
    await setChatInstanceState(chat_id, user_id, botConst.state.START, {
      metadata: "",
    });
  }
};

export const orderCreateDone = async (
  bot: TelegramBot,
  chat_id: number,
  user_id: number
) => {
  const chatInstance = await getChatInstance(chat_id, user_id);
  if (
    !(
      chatInstance.state === orderConst.state.GET_TITLE ||
      chatInstance.state === orderConst.state.GET_DESCRIPTION
    )
  )
    return;

  const order = await Order.findOne({
    where: { id: parseInt(chatInstance.metadata) },
  });

  if (!order) {
    await setChatInstanceState(chat_id, user_id, botConst.state.START, {
      metadata: "",
    });
    await bot.sendMessage(chat_id, "Kegiatan tidak ditemukan");
    return;
  }

  await bot.sendMessage(chat_id, `${order?.name} berhasil dibuat`);

  await bot.sendMessage(
    chat_id,
    `Anda dapat membagikan hasil list dengan command\n\n<strong>Data List Terbaru</strong>\n<code>/orderresult_${order.id}</code>\n<code>/orderresult_${order.id}@${telegramConfig.username}</code> untuk grup\n\n<strong>Auto Update Data</strong>\n<code>/orderresultrt_${order.id}</code>\n<code>/orderresultrt_${order.id}@${telegramConfig.username}</code> untuk grup\n\n<strong>Stop Auto Update Data</strong>\n<code>/orderresultrtstop_${order.id}</code>\n<code>/orderresultrtstop_${order.id}@${telegramConfig.username}</code> untuk grup\n<strong>Stop Semua Auto Update Data</strong>\n<code>/orderresultrtstopall_${order.id}</code>\nNote kirim ke grup:\n- bot harus menjadi member dari grup\n- Hanya yang sudah login sebagai Admin dari bot ini /auth yang bisa mengirim ke grup`,
    { parse_mode: "HTML" }
  );

  await orderAddResultListener(bot, chat_id, order.id);
};

export const orderGetResultText = async (order_id: number) => {
  const order = await Order.findOne({
    where: { id: order_id },
    include: [{ model: OrderList, as: "order_list" }],
  });

  if (!order) {
    return "";
  }

  const timeStr = new Date()
    .toLocaleString("id-ID", { timeZone: "Asia/Jakarta" })
    .split(", ")[1]
    .substring(0, 5);
  let order_list_text = `<blockquote>update ${timeStr} WIB</blockquote>\n<strong>${
    order.name
  }</strong>\n\n${
    order.description ? `${order.description}\n\n` : ""
  }Daftar Peserta:\n\n`;
  let count = 1;

  if (order.order_list.length) {
    for (const list of order.order_list) {
      const name = list.user_username
        ? `@${list.user_username}`
        : list.user_name;
      order_list_text += `${count}. ${list.value} (${name})\n`;
      count++;
    }
  } else {
    order_list_text += "<i>Belum Ada Peserta</i>";
  }

  const orderAppLink = getOrderAppLink(order.id);
  return `${order_list_text}\n\nLink Pendaftaran:\n${orderAppLink}`;
};

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
    return;
  }

  const orderResultText = await orderGetResultText(order_id);
  if (!orderResultText) {
    await bot.sendMessage(chat_id, "List tidak ditemukan", {
      message_thread_id: chat_thread_id,
    });
    return;
  }

  const listMsg = await bot.sendMessage(chat_id, orderResultText, {
    parse_mode: "HTML",
    message_thread_id: chat_thread_id,
  });
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
    return;
  }

  let condition: any = { chat_id, order_id };
  if (chat_thread_id) {
    condition.chat_thread_id = chat_thread_id;
  }

  const orderChatUpdate = await OrderChatUpdate.findOne({ where: condition });
  if (orderChatUpdate) {
    await bot.sendMessage(
      chat_id,
      "<strong>Hasil akan otomatis di update setiap ada yang mendaftar</strong>",
      { parse_mode: "HTML", message_thread_id: chat_thread_id }
    );
    if (command_message_id) {
      try {
        await bot.deleteMessage(chat_id, command_message_id);
      } catch (error: any) {
        console.log("Error ", error.toString());
      }
    }
    return;
  }

  await bot.sendMessage(
    chat_id,
    "<strong>Hasil akan otomatis di update setiap ada yang mendaftar</strong>",
    { parse_mode: "HTML", message_thread_id: chat_thread_id }
  );

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
      await bot.deleteMessage(chat_id, command_message_id);
    } catch (error: any) {
      console.log("Error ", error.toString());
    }
  }
};

export const orderListAdd = async (
  data: ICreateOrderList[],
  bot: TelegramBot
) => {
  if (!data.length) return;

  await OrderList.bulkCreate(data);

  const order_id = data[0].order_id;

  await orderListRealtimeUpdate(bot, order_id);
};

export const orderListRealtimeUpdate = async (
  bot: TelegramBot,
  order_id: number
) => {
  if (timer_id) clearTimeout(timer_id);

  timer_id = setTimeout(async () => {
    const orderUpdate = await OrderChatUpdate.findAll({ where: { order_id } });

    if (!orderUpdate.length) return;

    const orderResultText = await orderGetResultText(order_id);

    if (!orderResultText) return;

    for (const update of orderUpdate) {
      const lastMsg = await bot.sendMessage(update.chat_id, orderResultText, {
        parse_mode: "HTML",
        message_thread_id: update.chat_thread_id,
      });
      if (update.previous_message_id) {
        try {
          await bot.deleteMessage(update.chat_id, update.previous_message_id);
        } catch (error: any) {
          console.log("Error ", error.toString());
        }
      }
      await update.update({ previous_message_id: lastMsg.message_id });
    }
  }, 60000);
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
    return;
  }

  let condition: any = { chat_id, order_id };
  if (chat_thread_id) {
    condition.chat_thread_id = chat_thread_id;
  }

  const orderChatUpdate = await OrderChatUpdate.findOne({ where: condition });

  if (orderChatUpdate) {
    await orderChatUpdate.destroy();
    await bot.sendMessage(
      chat_id,
      "Pendaftaran selesai ditampilkan secara langsung",
      { message_thread_id: chat_thread_id }
    );
  }

  if (command_message_id) {
    try {
      await bot.deleteMessage(chat_id, command_message_id);
    } catch (error: any) {
      console.log("Error ", error.toString());
    }
  }
};

export const orderStopAllResultListener = async (
  bot: TelegramBot,
  chat_id: number,
  order_id?: number
) => {
  if (!order_id) {
    await bot.sendMessage(chat_id, "Order Id Invalid");
    return;
  }

  const orderChatCount = await OrderChatUpdate.count({ where: { order_id } });

  if (!orderChatCount) {
    await bot.sendMessage(chat_id, "Tidak ada update realtime yang berjalan");
    return;
  }

  await OrderChatUpdate.destroy({ where: { order_id } });

  await bot.sendMessage(chat_id, "Update realtime telah dihentikan");
};

export const orderGetTitle = async (order_id: number) => {
  const order = await Order.findOne({
    where: { id: order_id },
    attributes: ["id", "name"],
  });

  if (!order) {
    return {
      error: "Order Not Found",
    };
  }

  return {
    title: order.name,
  };
};

export const orderUserGetData = async (order_id: number, user_id: number) => {
  const orders = await OrderList.findAll({ where: { order_id, user_id } });
  return orders;
};

interface IOrderUserUpdateData {
  add?: ICreateOrderList[];
  edit?: { id: number; value: string }[];
  destroy?: number[];
}

export const orderUserUpdateData = async (
  bot: TelegramBot,
  order_id: number,
  updateData: IOrderUserUpdateData
) => {
  if (updateData.add?.length) {
    await OrderList.bulkCreate(updateData.add);
  }

  if (updateData.edit?.length) {
    for (const edit of updateData.edit) {
      await OrderList.update({ value: edit.value }, { where: { id: edit.id } });
    }
  }

  if (updateData.destroy) {
    await OrderList.destroy({ where: { id: updateData.destroy } });
  }

  await orderListRealtimeUpdate(bot, order_id);
};

export const orderSortAvallonInit = async (
  bot: TelegramBot,
  chat_id: number,
  user_id: number,
  order_id?: number
) => {
  if (!order_id) {
    await bot.sendMessage(chat_id, "Order Id Invalid");
    return;
  }

  await setChatInstanceState(
    chat_id,
    user_id,
    orderConst.state.GET_AVALLON_ORDER,
    { metadata: order_id.toString() }
  );
  await bot.sendMessage(
    chat_id,
    "Masukkan nomor list Avallon dengan angka dipisahkan koma (,) tanpa spasi:\ncontoh: 1,3,5,8,11,43"
  );
};

export const orderSortAvallonDone = async (
  bot: TelegramBot,
  chat_id: number,
  user_id: number,
  avallon_idx: number[]
) => {
  const chatInstance = await getChatInstance(chat_id, user_id);
  if (chatInstance.state !== orderConst.state.GET_AVALLON_ORDER) {
    return;
  }

  const order = await Order.findOne({
    where: { id: parseInt(chatInstance.metadata) },
    include: [{ model: OrderList, as: "order_list" }],
  });

  if (!order) {
    await setChatInstanceState(chat_id, user_id, botConst.state.START, {
      metadata: "",
    });
    await bot.sendMessage(chat_id, "Kegiatan Tidak Ditemukan");
    return;
  }

  const timeStr = new Date()
    .toLocaleString("id-ID", { timeZone: "Asia/Jakarta" })
    .split(", ")[1]
    .substring(0, 5);
  let order_list_text = `<blockquote>update ${timeStr} WIB</blockquote>\n<strong>${
    order.name
  }</strong>\n\n${
    order.description ? `${order.description}\n\n` : ""
  }Daftar Peserta:\n\n`;
  let count = 1;

  if (order.order_list.length) {
    const pesertaList = order.order_list.map((p) => p.value);

    const peserta = [];
    const avallon = [];

    for (let i = 0; i < pesertaList.length; i++) {
      if (avallon_idx.includes(i + 1)) {
        avallon.push(pesertaList[i]);
      } else {
        peserta.push(pesertaList[i]);
      }
    }
    let dv = 1;
    if (!peserta.length) {
      dv = 0;
    } else if (avallon.length < peserta.length) {
      dv = Math.ceil(peserta.length / avallon.length);
    }

    let avallonCount = 0;
    let pesertaCount = 0;
    let dvCount = 0;
    const result = [];
    for (let i = 0; i < pesertaList.length; i++) {
      if (
        (dvCount === 0 && avallonCount < avallon.length) ||
        (dv !== 0 && pesertaCount >= peserta.length)
      ) {
        result.push(`${i + 1}. ${avallon[avallonCount]}`);
        avallonCount++;
      } else {
        result.push(`${i + 1}. ${peserta[pesertaCount]}`);
        pesertaCount++;
      }

      if (dvCount === dv) {
        dvCount = 0;
      } else {
        dvCount++;
      }
    }
    order_list_text += result.join("\n");
  } else {
    order_list_text += "<i>Belum Ada Peserta</i>";
  }

  await setChatInstanceState(chat_id, user_id, botConst.state.START, {
    metadata: "",
  });
  await bot.sendMessage(chat_id, order_list_text);
};
