import { Op } from "sequelize";
import { glosariumConst } from "../constants/glosarium.const";
import { Glosarium } from "../databases/models/glosarium.model";
import TelegramBot from "node-telegram-bot-api";
import { telegramConfig } from "../configs/telegram.config";
import { databaseConfig } from "../configs/database.config";

export const getGlosariumWithPagination = async (
  page: number,
  wordFilter?: string
) => {
  const offset = (page - 1) * glosariumConst.pageLimit;

  let condition: any = {};

  if (wordFilter) {
    if (databaseConfig.dialect === "postgres") {
      condition.word = { [Op.iLike]: `${wordFilter}%` };
    } else {
      condition.word = { [Op.like]: `${wordFilter}%` };
    }
  }

  const glosarium = await Glosarium.findAndCountAll({
    attributes: ["id", "word"],
    where: condition,
    limit: glosariumConst.pageLimit,
    offset,
  });

  return {
    glosarium: glosarium.rows,
    pagination: {
      hasNext: offset + glosariumConst.pageLimit < glosarium.count,
      hasPrev: page !== 1,
    },
  };
};

export const getGlosariumMeaning = async (ids: number[]) => {
  const glosarium = await Glosarium.findAll({
    where: {
      id: { [Op.in]: ids },
    },
  });

  let sortOrder: any = {};
  ids.forEach((id, index) => {
    sortOrder[id] = index;
  });
  glosarium.sort((a, b) => sortOrder[a.id] - sortOrder[b.id]);

  return { glosarium };
};

export const getGlosariumLink = async (bot: TelegramBot, chat_id: number) => {
  await bot.sendMessage(
    chat_id,
    `${telegramConfig.uri}/${glosariumConst.webAppName}`
  );
};
