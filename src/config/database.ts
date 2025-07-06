import dotenv from "dotenv";
import { createTablesSQL } from "@/migrations";
import { Pool, PoolClient, Client } from "pg";
dotenv.config();
export const configDatabase = {
  user: process.env.DB_USER || "postgres",
  host: process.env.DB_HOST || "localhost",
  database: process.env.DB_NAME || "user_task",
  password: process.env.DB_PASSWORD || "password",
  port: parseInt(process.env.DB_PORT || "5432"),
};

export const pool = new Pool(configDatabase);

export async function createDatabaseIfNotExists({
  host,
  port,
  user,
  password,
  database,
}: {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
}): Promise<boolean> {
  const client = new Client(configDatabase);

  try {
    await client.connect();

    const checkQuery = "SELECT datname FROM pg_database WHERE datname = $1"; // datname is database name
    const result = await client.query(checkQuery, [database]);

    if (result.rows.length > 0) {
      console.log("result", result.rows);
      // return false;
    } else await client.query(`CREATE DATABASE "${database}"`);
    const result2 = await client.query(createTablesSQL)
    console.log(result2)
    
    return true;
  } catch (error) {
    throw error;
  } finally {
    // await client.end();
  }
}
