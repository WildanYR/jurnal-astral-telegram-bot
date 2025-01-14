import TelegramBot from "node-telegram-bot-api";
import {
  orderAddResultListener,
  orderCreateInit,
  orderGetResult,
  orderStopResultListener,
} from "../controllers/order.controller";
import {
  isAuthUser,
  unauthorizedMessage,
} from "../controllers/auth.controller";

export const initOrderHandler = (bot: TelegramBot) => {
  bot.onText(/\/ordercreate/, async (msg) => {
    if (msg.chat.type !== "private") return;

    const isAdmin = await isAuthUser(msg.from!.id);
    if (!isAdmin) {
      await unauthorizedMessage(bot, msg.chat.id);
      return;
    }

    await orderCreateInit(bot, msg.chat.id, msg.from!.id);
  });

  const handleOrderResult = async (
    msg: TelegramBot.Message,
    matches: RegExpExecArray | null
  ) => {
    const order_id = matches ? parseInt(matches[1].split("@")[0]) : undefined;
    const isAdmin = await isAuthUser(msg.from!.id);
    if (msg.chat.type !== "private" && !isAdmin) return;

    await orderGetResult(bot, msg.chat.id, order_id, msg.message_thread_id);
  };

  bot.onText(/\/orderresult (.+)/, handleOrderResult);
  bot.onText(/\/orderresult_(.+)/, handleOrderResult);

  const handleOrderResultRt = async (
    msg: TelegramBot.Message,
    matches: RegExpExecArray | null
  ) => {
    const order_id = matches ? parseInt(matches[1].split("@")[0]) : undefined;
    const isAdmin = await isAuthUser(msg.from!.id);
    if (msg.chat.type !== "private" && !isAdmin) return;

    await orderAddResultListener(
      bot,
      msg.chat.id,
      order_id,
      msg.message_thread_id,
      msg.message_id
    );
  };

  bot.onText(/\/orderresultrt (.+)/, handleOrderResultRt);
  bot.onText(/\/orderresultrt_(.+)/, handleOrderResultRt);

  const handleOrderResultStop = async (
    msg: TelegramBot.Message,
    matches: RegExpExecArray | null
  ) => {
    const order_id = matches ? parseInt(matches[1].split("@")[0]) : undefined;
    const isAdmin = await isAuthUser(msg.from!.id);
    if (msg.chat.type !== "private" && !isAdmin) return;

    await orderStopResultListener(
      bot,
      msg.chat.id,
      order_id,
      msg.message_thread_id,
      msg.message_id
    );
  };

  bot.onText(/\/orderresultrtstop (.+)/, handleOrderResultStop);
  bot.onText(/\/orderresultrtstop_(.+)/, handleOrderResultStop);
};
