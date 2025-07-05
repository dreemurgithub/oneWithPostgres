import { Pool, PoolClient } from "pg";
import { ITask,CreateTaskData } from "@/types/model";
import { v4 as uuidv4 } from "uuid";
import { pool } from "@/config/database";
import { User } from "./user";

export class Task {
  public id?: string;
  public description: string;
  public userId: string;

  constructor(data: ITask) {
    this.id = data.id;
    this.description = data.description;
    this.userId = data.userId;
  }

  static async create(taskData: CreateTaskData): Promise<Task> {
    // Verify user exists
    const userExists = await pool.query('SELECT id FROM users WHERE id = $1', [taskData.userId]);
    if (userExists.rows.length === 0) {
      throw new Error('User not found');
    }

    // Generate UUID and insert task
    const id = uuidv4();
    const query = `
      INSERT INTO tasks (id, description, user_id)
      VALUES ($1, $2, $3)
      RETURNING id, description, user_id
    `;

    const values = [id, taskData.description, taskData.userId];
    const result = await pool.query(query, values);
    const row = result.rows[0];

    return new Task({
      id: row.id,
      description: row.description,
      userId: row.user_id
    });
  }

  static async findById(id: string): Promise<Task | null> {
    const query = 'SELECT id, description, user_id FROM tasks WHERE id = $1';
    const result = await pool.query(query, [id]);
    
    if (result.rows.length === 0) return null;

    const row = result.rows[0];
    return new Task({
      id: row.id,
      description: row.description,
      userId: row.user_id
    });
  }

  static async findByUserId(userId: string): Promise<Task[]> {
    const query = 'SELECT id, description, user_id FROM tasks WHERE user_id = $1 ORDER BY id';
    const result = await pool.query(query, [userId]);
    
    return result.rows.map(row => new Task({
      id: row.id,
      description: row.description,
      userId: row.user_id
    }));
  }

  async getUser(): Promise<User | null> {
    return User.findById(this.userId);
  }

  async save(): Promise<void> {
    if (!this.id) throw new Error('Cannot save task without ID');
    
    const query = 'UPDATE tasks SET description = $1 WHERE id = $2';
    await pool.query(query, [this.description, this.id]);
  }

  async delete(): Promise<void> {
    if (!this.id) throw new Error('Cannot delete task without ID');
    
    await pool.query('DELETE FROM tasks WHERE id = $1', [this.id]);
    this.id = undefined;
  }

  toJSON(): ITask {
    return {
      id: this.id,
      description: this.description,
      userId: this.userId
    };
  }
}
