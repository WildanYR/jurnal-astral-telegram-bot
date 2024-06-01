import {
  DataTypes,
  InitOptions,
  Model,
  ModelAttributes,
  Optional,
} from "sequelize";

interface IGlosariumAttributes {
  id: number;
  word: string;
  meaning?: string;
}

interface ICreateGlosariumAttributes
  extends Optional<IGlosariumAttributes, "id"> {}

export class Glosarium extends Model<
  IGlosariumAttributes,
  ICreateGlosariumAttributes
> {
  static getModelAttributes(): ModelAttributes<
    Glosarium,
    Optional<IGlosariumAttributes, never>
  > {
    return {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      word: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      meaning: {
        type: DataTypes.TEXT,
      },
    };
  }

  static getInitOptions(): Optional<InitOptions, "sequelize"> {
    return {
      modelName: "Glosarium",
      tableName: "glosarium",
    };
  }

  declare id: number;
  declare word: string;
  declare meaning: string;
  declare created_at: Date;
  declare updated_at: Date;
}
