import path from "node:path";

export const ENV = {
  appId: process.env.VITE_APP_ID ?? "antonini-self-hosted",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  isProduction: process.env.NODE_ENV === "production",
  storageDir: path.resolve(process.env.STORAGE_DIR ?? "./storage"),

  // Legacy template helpers remain compile-compatible but are not required by
  // the Antonini storefront/admin self-hosted flow.
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
};
