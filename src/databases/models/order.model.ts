import {
  DataTypes,
  InitOptions,
  Model,
  ModelAttributes,
  Optional,
} from "sequelize";
import { OrderList } from "./order_list.model";
import { OrderChatUpdate } from "./order_chat_update.model";

interface IOrderAttributes {
  id: number;
  name: string;
}

interface ICreateOrderAttributes extends Optional<IOrderAttributes, "id"> {}

export class Order extends Model<IOrderAttributes, ICreateOrderAttributes> {
  static getModelAttributes(): ModelAttributes<
    Order,
    Optional<IOrderAttributes, never>
  > {
    return {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
    };
  }

  static getInitOptions(): Optional<InitOptions, "sequelize"> {
    return {
      modelName: "Order",
      tableName: `order`,
    };
  }

  static association() {
    Order.hasMany(OrderList, {
      foreignKey: "order_id",
      as: "order_list",
    });
    Order.hasMany(OrderChatUpdate, {
      foreignKey: "order_id",
      as: "order_chat_update",
    });
  }

  declare id: number;
  declare name: string;
  declare created_at: Date;
  declare updated_at: Date;

  declare order_list: OrderList[];
  declare order_chat_update: OrderChatUpdate[];
}
