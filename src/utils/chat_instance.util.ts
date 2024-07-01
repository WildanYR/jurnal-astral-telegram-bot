import { Transaction } from "sequelize";
import { botConst } from "../constants/bot.const";
import { ChatInstance } from "../databases/models/chat_instance.model";

interface IChatInstanceOption {
  transaction?: Transaction;
  metadata?: string;
}

export const getChatInstance = async (
  chat_id: number,
  user_id: number,
  options?: IChatInstanceOption
) => {
  const chatInstance = await ChatInstance.findOne({
    where: { chat_id, user_id },
    transaction: options?.transaction,
  });

  if (!chatInstance) {
    const newChatInstance = await ChatInstance.create(
      {
        chat_id,
        user_id,
        authorize: false,
        state: botConst.state.START,
      },
      { transaction: options?.transaction }
    );
    return newChatInstance;
  }

  return chatInstance;
};

export const setChatInstanceState = async (
  chat_id: number,
  user_id: number,
  state: string,
  options?: IChatInstanceOption
) => {
  await ChatInstance.update(
    { state, metadata: options?.metadata },
    { where: { chat_id, user_id }, transaction: options?.transaction }
  );
};
