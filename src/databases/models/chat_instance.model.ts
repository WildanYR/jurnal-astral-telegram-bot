import {
  DataTypes,
  InitOptions,
  Model,
  ModelAttributes,
  Optional,
} from "sequelize";

interface IChatInstanceAttributes {
  id: number;
  chat_id: number;
  user_id: number;
  authorize: boolean;
  state?: string;
}

interface ICreateChatInstanceAttributes
  extends Optional<IChatInstanceAttributes, "id"> {}

export class ChatInstance extends Model<
  IChatInstanceAttributes,
  ICreateChatInstanceAttributes
> {
  static getModelAttributes(): ModelAttributes<
    ChatInstance,
    Optional<IChatInstanceAttributes, never>
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
      user_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
      },
      authorize: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false,
      },
      state: {
        type: DataTypes.STRING,
      },
    };
  }

  static getInitOptions(): Optional<InitOptions, "sequelize"> {
    return {
      modelName: "ChatInstance",
      tableName: "chat_instance",
    };
  }

  declare id: number;
  declare chat_id: number;
  declare user_id: number;
  declare authorize: boolean;
  declare state: string;
  declare created_at: Date;
  declare updated_at: Date;
}
