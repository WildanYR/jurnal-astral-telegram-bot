import { Op, QueryTypes, literal } from "sequelize";
import { glosariumConst } from "../constants/glosarium.const";
import { Glosarium } from "../databases/models/glosarium.model";
import TelegramBot from "node-telegram-bot-api";
import { telegramConfig } from "../configs/telegram.config";
import { databaseConfig } from "../configs/database.config";
import { sequelize } from "../databases";

export const getGlosariumWithPagination = async (
  page: number,
  wordFilter?: string,
  withMeaning?: boolean
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

  const attributes = ["id", "word"];

  if (withMeaning) {
    attributes.push("meaning");
  }

  const glosarium = await Glosarium.findAndCountAll({
    attributes,
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

export const searchGlosariumMeaning = async (
  page: number,
  wordFilter?: string
) => {
  const offset = (page - 1) * glosariumConst.pageLimit;

  // const glosarium = await Glosarium.findAll({
  //   attributes: ["id", "word", "meaning"],
  //   where: [literal("MATCH (meaning) AGAINST (:meaning)")],
  //   replacements: {
  //     meaning: wordFilter,
  //   },
  //   limit: glosariumConst.pageLimit,
  //   offset,
  // });

  const glosarium = await sequelize.query(
    "SELECT id, word, meaning FROM glosarium WHERE MATCH (meaning) AGAINST (:meaning) LIMIT :limit OFFSET :offset",
    {
      replacements: {
        meaning: wordFilter,
        limit: glosariumConst.pageLimit,
        offset,
      },
      type: QueryTypes.SELECT,
    }
  );

  const glosariumCount = await Glosarium.count();

  return {
    glosarium: glosarium,
    pagination: {
      hasNext: offset + glosariumConst.pageLimit < glosariumCount,
      hasPrev: page !== 1,
    },
  };

  return { glosarium };
};

export const getGlosariumLink = async (
  bot: TelegramBot,
  chat_id: number,
  chat_thread_id?: number
) => {
  await bot.sendMessage(
    chat_id,
    `${telegramConfig.uri}/${glosariumConst.webAppName}`,
    { message_thread_id: chat_thread_id }
  );
};
