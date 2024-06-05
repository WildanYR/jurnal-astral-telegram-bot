import {
  DataTypes,
  InitOptions,
  Model,
  ModelAttributes,
  Optional,
} from "sequelize";
import { Order } from "./order.model";

interface IOrderChatUpdateAttributes {
  id: number;
  chat_id: number;
  previous_message_id?: number;
  chat_thread_id?: number;
  order_id: number;
}

interface ICreateOrderChatUpdateAttributes
  extends Optional<IOrderChatUpdateAttributes, "id"> {}

export class OrderChatUpdate extends Model<
  IOrderChatUpdateAttributes,
  ICreateOrderChatUpdateAttributes
> {
  static getModelAttributes(): ModelAttributes<
    OrderChatUpdate,
    Optional<IOrderChatUpdateAttributes, never>
  > {
    return {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      chat_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
      },
      previous_message_id: {
        type: DataTypes.BIGINT,
      },
      chat_thread_id: {
        type: DataTypes.BIGINT,
      },
      order_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
      },
    };
  }

  static getInitOptions(): Optional<InitOptions, "sequelize"> {
    return {
      modelName: "OrderChatUpdate",
      tableName: "order_chat_update",
    };
  }

  static association() {
    OrderChatUpdate.belongsTo(Order, {
      foreignKey: "order_id",
      as: "order",
    });
  }

  declare id: number;
  declare chat_id: number;
  declare previous_message_id: number;
  declare chat_thread_id: number;
  declare order_id: number;
  declare created_at: Date;
  declare updated_at: Date;

  declare order: Order;
}
