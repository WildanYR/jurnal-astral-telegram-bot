import { Transaction } from "sequelize";
import { botConst } from "../constants/bot.const";
import { ChatInstance } from "../databases/models/chat_instance.model";

export const getChatInstance = async (
  chat_id: number,
  user_id: number,
  transaction?: Transaction
) => {
  const chatInstance = await ChatInstance.findOne({
    where: { chat_id, user_id },
    transaction,
  });

  if (!chatInstance) {
    const newChatInstance = await ChatInstance.create(
      {
        chat_id,
        user_id,
        authorize: false,
        state: botConst.state.START,
      },
      { transaction }
    );
    return newChatInstance;
  }

  return chatInstance;
};

export const setChatInstanceState = async (
  chat_id: number,
  user_id: number,
  state: string,
  transaction?: Transaction
) => {
  await ChatInstance.update(
    { state },
    { where: { chat_id, user_id }, transaction }
  );
};
