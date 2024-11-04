import { Sequelize } from "sequelize";
import { databaseConfig } from "../configs/database.config";
import { ChatInstance } from "./models/chat_instance.model";
import { Order } from "./models/order.model";
import { OrderList } from "./models/order_list.model";
import { Glosarium } from "./models/glosarium.model";
import { OrderChatUpdate } from "./models/order_chat_update.model";
import { AuthorizeUser } from "./models/authorize_user.model";

export let sequelize: Sequelize;

export const initDatabase = () => {
  if (!sequelize) {
    sequelize = new Sequelize(
      databaseConfig.dbname,
      databaseConfig.username,
      databaseConfig.password,
      {
        host: databaseConfig.host,
        dialect: databaseConfig.dialect as any,
        port: databaseConfig.port,
        define: {
          freezeTableName: true,
          timestamps: true,
          createdAt: "created_at",
          updatedAt: "updated_at",
        },
        dialectOptions: {
          connectTimeout: 60000,
        },
      }
    );
  }

  /** Load Models */
  ChatInstance.init(ChatInstance.getModelAttributes(), {
    ...ChatInstance.getInitOptions(),
    sequelize,
  });
  Order.init(Order.getModelAttributes(), {
    ...Order.getInitOptions(),
    sequelize,
  });
  OrderList.init(OrderList.getModelAttributes(), {
    ...OrderList.getInitOptions(),
    sequelize,
  });
  OrderChatUpdate.init(OrderChatUpdate.getModelAttributes(), {
    ...OrderChatUpdate.getInitOptions(),
    sequelize,
  });
  Glosarium.init(Glosarium.getModelAttributes(), {
    ...Glosarium.getInitOptions(),
    sequelize,
  });
  AuthorizeUser.init(AuthorizeUser.getModelAttributes(), {
    ...AuthorizeUser.getInitOptions(),
    sequelize,
  });

  /** Load Model Association */
  Order.association();
  OrderList.association();
  OrderChatUpdate.association();
};
