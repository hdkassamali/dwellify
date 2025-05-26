const Admin = require("./database/entities/admin");
const Lease = require("./database/entities/lease");
const Apartment = require("./database/entities/apartment");
const Tenant = require("./database/entities/tenant");
const Complaint = require("./database/entities/complaint");
const AccessControl = require("./database/entities/accessControl");

const {
  DB_USER,
  DB_HOST,
  DB_PORT,
  DB_USERNAME,
  DB_PASSWORD,
  DB_DATABASE,
  NODE_ENV,
} = process.env;

const isProduction = NODE_ENV === "production";

const connections = {
  production: {
    name: undefined,
    type: "postgres",
    host: DB_HOST,
    port: Number(DB_PORT || 5432),
    username: DB_USERNAME,
    password: DB_PASSWORD,
    database: DB_DATABASE,
    synchronize: false,
    logging: false,
  },
  development: {
    name: "default",
    type: "postgres",
    host: DB_HOST || "localhost",
    port: Number(DB_PORT || 5432),
    username: DB_USERNAME || "postgres",
    password: DB_PASSWORD || "password",
    database: DB_DATABASE || "tenant_portal",
    synchronize: false,
    logging: true,
  },
};

const envConfig = isProduction
  ? connections.production
  : connections.development;

module.exports = {
  ...envConfig,
  entities: [Admin, Lease, Apartment, Tenant, Complaint, AccessControl],
  migrations: ["./database/migrations/**/*.js"],
  experimentalDecorators: true,
  emitDecoratorMetadata: true,
};
