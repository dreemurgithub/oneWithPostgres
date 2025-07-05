// User interfaces
export interface IUser {
  id?: string;
  username: string;
  password?: string;
  passwordHash?: string;
  name: string;
}

export interface CreateUserData {
  username: string;
  password: string;
  name: string;
}

// Task interfaces
export interface ITask {
  id?: string;
  description: string;
  userId: string;
}

export interface CreateTaskData {
  description: string;
  userId: string;
}
