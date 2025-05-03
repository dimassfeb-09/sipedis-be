import { Pool } from "pg";

export const pool: Pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "sipedis",
  password: "password",
  port: 5432,
});
