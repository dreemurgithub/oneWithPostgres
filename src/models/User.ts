import { Pool, PoolClient } from "pg";
import bcrypt from "bcrypt";
import { v4 as uuidv4 } from "uuid";
import { pool } from "@/config/database";
import { IUser,CreateTaskData,CreateUserData,ITask } from "@/types/model";
import { Task } from "./Task";

export class User {
  public id?: string;
  public username: string;
  public passwordHash?: string;
  public name: string;

  constructor(data: IUser) {
    this.id = data.id;
    this.username = data.username;
    this.passwordHash = data.passwordHash;
    this.name = data.name;
  }

  async setPassword(password: string): Promise<void> {
    if (!password || password.length < 6) {
      throw new Error('Password must be at least 6 characters long');
    }
    const saltRounds = 10;
    this.passwordHash = await bcrypt.hash(password, saltRounds);
  }

  async checkPassword(password: string): Promise<boolean> {
    if (!this.passwordHash) return false;
    return bcrypt.compare(password, this.passwordHash);
  }

  static async create(userData: CreateUserData): Promise<User> {
    // Check if username already exists
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE username = $1',
      [userData.username]
    );

    if (existingUser.rows.length > 0) {
      throw new Error('Username already exists');
    }

    // Generate UUID and hash password
    const id = uuidv4();
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(userData.password, saltRounds);

    // Insert new user
    const query = `
      INSERT INTO users (id, username, password_hash, name)
      VALUES ($1, $2, $3, $4)
      RETURNING id, username, name
    `;

    const values = [id, userData.username, passwordHash, userData.name];
    const result = await pool.query(query, values);
    const row = result.rows[0];

    return new User({
      id: row.id,
      username: row.username,
      passwordHash: passwordHash,
      name: row.name
    });
  }

  static async findById(id: string): Promise<User | null> {
    const query = 'SELECT id, username, password_hash, name FROM users WHERE id = $1';
    const result = await pool.query(query, [id]);
    
    if (result.rows.length === 0) return null;

    const row = result.rows[0];
    return new User({
      id: row.id,
      username: row.username,
      passwordHash: row.password_hash,
      name: row.name
    });
  }

  static async findByUsername(username: string): Promise<User | null> {
    const query = 'SELECT id, username, password_hash, name FROM users WHERE username = $1';
    const result = await pool.query(query, [username]);
    
    if (result.rows.length === 0) return null;

    const row = result.rows[0];
    return new User({
      id: row.id,
      username: row.username,
      passwordHash: row.password_hash,
      name: row.name
    });
  }

  async getTasks(): Promise<Task[]> {
    if (!this.id) throw new Error('User must have an ID to get tasks');
    return Task.findByUserId(this.id);
  }

  toJSON(): Omit<IUser, 'passwordHash'> {
    return {
      id: this.id,
      username: this.username,
      name: this.name
    };
  }

}

// SQL schema
export const createTablesSQL = `
  CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

  CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(80) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL
  );

  CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    description TEXT NOT NULL,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
  CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
`;
