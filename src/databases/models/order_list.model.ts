import {
  DataTypes,
  InitOptions,
  Model,
  ModelAttributes,
  Optional,
} from "sequelize";
import { Order } from "./order.model";

interface IOrderListAttributes {
  id: number;
  value: string;
  order_id: number;
  user_id?: number;
  user_name?: string;
  user_username?: string;
  metadata?: string;
}

interface ICreateOrderListAttributes
  extends Optional<IOrderListAttributes, "id"> {}

export class OrderList extends Model<
  IOrderListAttributes,
  ICreateOrderListAttributes
> {
  static getModelAttributes(): ModelAttributes<
    OrderList,
    Optional<IOrderListAttributes, never>
  > {
    return {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      value: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      order_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
      },
      user_id: DataTypes.BIGINT,
      user_name: DataTypes.STRING,
      user_username: DataTypes.STRING,
      metadata: DataTypes.TEXT,
    };
  }

  static getInitOptions(): Optional<InitOptions, "sequelize"> {
    return {
      modelName: "OrderList",
      tableName: "order_list",
    };
  }

  static association() {
    OrderList.belongsTo(Order, {
      foreignKey: "order_id",
      as: "order",
    });
  }

  declare id: number;
  declare value: string;
  declare order_id: number;
  declare user_id: number;
  declare user_name: string;
  declare user_username: string;
  declare metadata: string;
  declare created_at: Date;
  declare updated_at: Date;

  declare order: Order;
}
