export const appConfig = {
  port: parseInt(process.env.PORT as string) || 3000,
  isProduction: process.env.NODE_ENV === "production",
  token: process.env.AUTH_TOKEN
};
