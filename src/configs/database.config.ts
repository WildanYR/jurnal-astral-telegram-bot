export const databaseConfig = {
  username: process.env.DATABASE_USERNAME || "root",
  password: process.env.DATABASE_PASSWORD || "",
  host: process.env.DATABASE_HOST || "localhost",
  port: parseInt(process.env.DATABASE_PORT as string) || 3306,
  dbname: process.env.DATABASE_DBNAME || "jurnal_astral_bot",
  dialect: "mysql",
};
