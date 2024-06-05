import TelegramBot from "node-telegram-bot-api";
import { appConfig } from "../configs/app.config";
import { AuthorizeUser } from "../databases/models/authorize_user.model";
import { setChatInstanceState } from "../utils/chat_instance.util";
import { authConst } from "../constants/auth.const";
import { botConst } from "../constants/bot.const";

export const authInit = async (bot: TelegramBot, chat_id: number, user_id: number) => {
  await bot.sendMessage(chat_id, 'Silahkan masukkan token')
  await setChatInstanceState(chat_id, user_id, authConst.state.GET_TOKEN)
}

export const authValidate = async (bot: TelegramBot, chat_id: number, user_id: number, token: string) => {
  if (token !== appConfig.token) {
    await bot.sendMessage(chat_id, 'Login Gagal, Token Invalid')
    return
  }
  
  const authorizeUser = await AuthorizeUser.findOne({where: {user_id}})
  if (authorizeUser) {
    await bot.sendMessage(chat_id, 'Anda sudah terdaftar sebagai Admin')
    return
  }
  
  try {
    await AuthorizeUser.create({user_id})
    await bot.sendMessage(chat_id, 'Login Berhasil, Anda telah menjadi Admin')
  } catch (error: any) {
    console.log('Error ', error.toString())
  }
  await setChatInstanceState(chat_id, user_id, botConst.state.START)
}

export const isAuthUser = async (user_id: number) => {
  const count = await AuthorizeUser.count({where: {user_id}})
  return count > 0
}

export const logout = async (bot: TelegramBot, chat_id: number, user_id: number) => {
  const authorizeUser = await AuthorizeUser.findOne({where: {user_id}})
  if (!authorizeUser) {
    await bot.sendMessage(chat_id, 'Anda belum login sebagai admin')
    return
  }

  await authorizeUser.destroy()
  await bot.sendMessage(chat_id, 'Logout berhasil')
}