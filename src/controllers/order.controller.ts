import TelegramBot, { InlineKeyboardButton } from "node-telegram-bot-api";
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
import { OrderCategory } from "../types/order_category.type";
import {
  OrderMetadataDragonRing,
  OrderMetadataFormasiPiramid,
} from "../types/order_metadata.type";
import { sequelize } from "../databases";

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
  await setChatInstanceState(chat_id, user_id, orderConst.state.GET_CATEGORY);

  const categoryInlineKeyboard: InlineKeyboardButton[][] =
    orderConst.category.map((item) => {
      return [
        {
          text: item.label,
          callback_data: `${orderConst.callbackData.CATEGORY};${chat_id};${user_id};${item.value}`,
        },
      ];
    });

  await bot.sendMessage(chat_id, "Silahkan Pilih Kategori", {
    reply_markup: {
      inline_keyboard: categoryInlineKeyboard,
    },
  });
};

export const orderCreateSetCategory = async (
  bot: TelegramBot,
  chat_id: number,
  user_id: number,
  category: OrderCategory
) => {
  await setChatInstanceState(chat_id, user_id, orderConst.state.GET_TITLE, {
    metadata: category,
  });
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
  const chatInstance = await getChatInstance(chat_id, user_id);
  const order = await Order.create({
    name: title,
    category: chatInstance.metadata,
  });
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
    `Anda dapat membagikan hasil list dengan command\n\n<strong>Data List Terbaru</strong>\n<code>/orderresult_${order.id}</code>\n<code>/orderresult_${order.id}@${telegramConfig.username}</code> untuk grup\n\n<strong>Auto Update Data</strong>\n<code>/orderresultrt_${order.id}</code>\n<code>/orderresultrt_${order.id}@${telegramConfig.username}</code> untuk grup\n\n<strong>Stop Auto Update Data</strong>\n<code>/orderresultrtstop_${order.id}</code>\n<code>/orderresultrtstop_${order.id}@${telegramConfig.username}</code> untuk grup\n\nNote kirim ke grup:\n- bot harus menjadi member dari grup\n- Hanya yang sudah login sebagai Admin dari bot ini /auth yang bisa mengirim ke grup`,
    { parse_mode: "HTML" }
  );

  await orderAddResultListener(bot, chat_id, order.id);
};

const generateOrderResultTemplate = (
  id: number,
  title: string,
  description: string,
  list: string
) => {
  const timeStr = new Date()
    .toLocaleString("id-ID", { timeZone: "Asia/Jakarta" })
    .split(", ")[1]
    .substring(0, 5);

  const orderAppLink = getOrderAppLink(id);

  return `<blockquote>update ${timeStr} WIB</blockquote>\n<strong>${title}</strong>\n\n${
    description ? `${description}\n\n` : ""
  }${
    list ? `${list}\n\n` : "<i>Belum Ada List</i>\n\n"
  }Link Pendaftaran:\n${orderAppLink}`;
};

export const orderResultDefault = async (order: Order) => {
  let order_list_text = "";
  let count = 1;

  if (order.order_list.length) {
    for (const list of order.order_list) {
      order_list_text += `${count}. ${list.value}\n`;
      count++;
    }
  }

  return generateOrderResultTemplate(
    order.id,
    order.name,
    order.description,
    order_list_text
  );
};

export const orderResultDragonRing = async (order: Order) => {
  let order_list_text = "";

  if (order.order_list.length >= 3) {
    const pesertaList = order.order_list.map((p) => {
      const metadata = JSON.parse(p.metadata) as OrderMetadataDragonRing;
      const isAvallon = metadata.isAvallon;
      return {
        name: p.value,
        isAvallon,
      };
    });

    const peserta = [];
    const avallon = [];

    for (let i = 0; i < pesertaList.length; i++) {
      if (pesertaList[i].isAvallon) {
        avallon.push(pesertaList[i].name);
      } else {
        peserta.push(pesertaList[i].name);
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
    order_list_text +=
      "Peserta akan ditampilkan setelah minimal 3 peserta terdaftar";
  }

  return generateOrderResultTemplate(
    order.id,
    order.name,
    order.description,
    order_list_text
  );
};

export const orderResultFormasiPiramid = async (order: Order) => {
  let order_list_text = "";

  if (order.order_list.length) {
    const pesertaList = order.order_list.map((p) => {
      const metadata = JSON.parse(p.metadata) as OrderMetadataFormasiPiramid;
      const position = metadata.position;
      return {
        name: p.value,
        position,
      };
    });

    const jp = [];
    const t12 = [];
    const support = [];
    for (const peserta of pesertaList) {
      if (peserta.position === "JP") {
        jp.push(peserta.name);
      }
      if (peserta.position === "T12") {
        t12.push(peserta.name);
      }
      if (peserta.position === "SUPPORT") {
        support.push(peserta.name);
      }
    }

    if (t12.length < 9 && support.length > 0) {
      const t12Need = 9 - t12.length;

      for (let i = 0; i < t12Need; i++) {
        console.log({ i, sl: support.length, s: support, t12 });
        if (support.length === 0) break;
        const sp = support.shift();
        t12.push(sp);
      }
    }

    order_list_text += "PIC: \n\n";

    order_list_text += "JP:\n";
    if (jp.length) {
      for (let i = 0; i < jp.length; i++) {
        order_list_text += `${i + 1}. ${jp[i]}\n`;
      }
    } else {
      for (let i = 0; i < 3; i++) {
        order_list_text += `${i + 1}. \n`;
      }
    }

    order_list_text += "\nBARA: \n";

    order_list_text += "\nT12:\n";
    if (t12.length) {
      for (let i = 0; i < t12.length; i++) {
        order_list_text += `${i + 1}. ${t12[i]}\n`;
      }
    } else {
      for (let i = 0; i < 9; i++) {
        order_list_text += `${i + 1}. \n`;
      }
    }

    order_list_text += "\nNIPUL: \n";

    order_list_text += "\nSupport:\n";
    if (support.length) {
      const supportLoop = support.length > 15 ? 15 : support.length;
      for (let i = 0; i < supportLoop; i++) {
        order_list_text += `${i + 1}. ${support[i]}\n`;
      }

      if (support.length > 15) {
        order_list_text += "\nStandby:\n";
        for (let i = 15; i < support.length; i++) {
          order_list_text += `${i - 14}. ${support[i]}\n`;
        }
      }
    } else {
      for (let i = 0; i < 15; i++) {
        order_list_text += `${i + 1}. \n`;
      }
    }
  }

  return generateOrderResultTemplate(
    order.id,
    order.name,
    order.description,
    order_list_text
  );
};

const generateOrderResultText = async (order_id: number) => {
  const order = await Order.findOne({
    where: { id: order_id },
    include: [{ model: OrderList, as: "order_list" }],
  });

  if (order) {
    if (order.category === "DEFAULT") return await orderResultDefault(order);
    if (order.category === "DRAGON_RING")
      return await orderResultDragonRing(order);
    if (order.category === "FORMASI_PIRAMID")
      return await orderResultFormasiPiramid(order);
  }

  return "List tidak ditemukan";
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

  const orderResultText = await generateOrderResultText(order_id);
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

    const orderResultText = await generateOrderResultText(order_id);

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

  const transaction = await sequelize.transaction();
  try {
    await OrderChatUpdate.destroy({ where: { order_id }, transaction });
    await Order.update(
      { stop: true },
      { where: { id: order_id }, transaction }
    );
    await transaction.commit();
  } catch (error: any) {
    console.log("Error ", error.toString());
    await transaction.rollback();
    await bot.sendMessage(
      chat_id,
      "Terjadi kesalahan saat menghentikan pendaftaran. silahkan coba lagi setelah 1 menit",
      { message_thread_id: chat_thread_id }
    );
  }

  await bot.sendMessage(
    chat_id,
    "Pendaftaran selesai ditampilkan secara langsung",
    { message_thread_id: chat_thread_id }
  );

  if (command_message_id) {
    try {
      await bot.deleteMessage(chat_id, command_message_id);
    } catch (error: any) {
      console.log("Error ", error.toString());
    }
  }
};

export const orderGetTitle = async (order_id: number) => {
  const order = await Order.findOne({
    where: { id: order_id },
    attributes: ["id", "name", "category", "stop"],
  });

  if (!order) {
    return {
      error: "Order Not Found",
    };
  }

  return {
    title: order.name,
    category: order.category,
    stop: order.stop,
  };
};

export const orderUserGetData = async (order_id: number, user_id: number) => {
  const orders = await OrderList.findAll({ where: { order_id, user_id } });
  return orders;
};

export const orderUserCancel = async (
  bot: TelegramBot,
  order_id: number,
  user_id: number
) => {
  await OrderList.destroy({ where: { order_id, user_id } });
  await orderListRealtimeUpdate(bot, order_id);
};

interface IOrderUserUpdateData {
  add?: ICreateOrderList[];
  edit?: { id: number; value: string; metadata: string }[];
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
      await OrderList.update(
        { value: edit.value, metadata: edit.metadata },
        { where: { id: edit.id } }
      );
    }
  }

  if (updateData.destroy) {
    await OrderList.destroy({ where: { id: updateData.destroy } });
  }

  await orderListRealtimeUpdate(bot, order_id);
};
