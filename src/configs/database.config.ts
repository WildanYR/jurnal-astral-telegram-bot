export const databaseConfig = {
  username: process.env.DATABASE_USERNAME || "",
  password: process.env.DATABASE_PASSWORD || "",
  host: process.env.DATABASE_HOST || "",
  port: parseInt(process.env.DATABASE_PORT as string),
  dbname: process.env.DATABASE_DBNAME || "",
  dialect: process.env.DATABASE_DIALECT || "mysql",
};
