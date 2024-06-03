require("dotenv").config();

module.exports = {
  username: process.env.DATABASE_USERNAME || "root",
  password: process.env.DATABASE_PASSWORD || "",
  host: process.env.DATABASE_HOST || "localhost",
  port: process.env.DATABASE_PORT || 3306,
  database: process.env.DATABASE_DBNAME || "jurnal_astral_bot",
  dialect: process.env.DATABASE_DIALECT || "mysql",
  seederStorage: "sequelize",
};
