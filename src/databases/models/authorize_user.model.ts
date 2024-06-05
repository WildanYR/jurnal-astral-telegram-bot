import {
  DataTypes,
  InitOptions,
  Model,
  ModelAttributes,
  Optional,
} from "sequelize";
interface IAuthorizeUserAttributes {
  id: number;
  user_id: number;
}

interface ICreateAuthorizeUserAttributes extends Optional<IAuthorizeUserAttributes, "id"> {}

export class AuthorizeUser extends Model<IAuthorizeUserAttributes, ICreateAuthorizeUserAttributes> {
  static getModelAttributes(): ModelAttributes<
    AuthorizeUser,
    Optional<IAuthorizeUserAttributes, never>
  > {
    return {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      user_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
      },
    };
  }

  static getInitOptions(): Optional<InitOptions, "sequelize"> {
    return {
      modelName: "AuthorizeUser",
      tableName: `authorize_user`,
    };
  }

  declare id: number;
  declare user_id: number;
  declare created_at: Date;
  declare updated_at: Date;
}
