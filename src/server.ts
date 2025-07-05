import express, { Request, Response } from "express";
import dotenv from "dotenv";
import { User } from "./models/User";
import { Task } from "./models/Task";

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS middleware (simple version)
app.use((req: Request, res: Response, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  if (req.method === "OPTIONS") {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Health check endpoint
app.get("/health", (req: Request, res: Response) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

// User routes
app.post("/api/users", async (req: Request, res: Response) => {
  try {
    const { username, password, name } = req.body;

    if (!username || !password || !name) {
      res
        .status(400)
        .json({ error: "Username, password, and name are required" });
      return;
    }

    const user = await User.create({ username, password, name });
    res.status(201).json(user.toJSON());
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(400).json({
      error: error instanceof Error ? error.message : "Failed to create user",
    });
  }
});

app.get("/api/users/:id", async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    res.json(user.toJSON());
  } catch (error) {
    console.error("Error finding user:", error);
    res.status(500).json({ error: "Failed to find user" });
  }
});

app.get(
  "/api/users/username/:username",
  async (req: Request, res: Response) => {
    try {
      const user = await User.findByUsername(req.params.username);
      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }
      res.json(user.toJSON());
    } catch (error) {
      console.error("Error finding user:", error);
      res.status(500).json({ error: "Failed to find user" });
    }
  }
);

// Authentication endpoint
app.post("/api/auth/login", async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      res.status(400).json({ error: "Username and password are required" });
      return;
    }

    const user = await User.findByUsername(username);
    if (!user || !(await user.checkPassword(password))) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    res.json({ message: "Login successful", user: user.toJSON() });
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).json({ error: "Login failed" });
  }
});

// Task routes
app.post("/api/tasks", async (req: Request, res: Response) => {
  try {
    const { description, userId } = req.body;

    if (!description || !userId) {
      res.status(400).json({ error: "Description and userId are required" });
      return;
    }

    const task = await Task.create({ description, userId });
    res.status(201).json(task.toJSON());
  } catch (error) {
    console.error("Error creating task:", error);
    res.status(400).json({
      error: error instanceof Error ? error.message : "Failed to create task",
    });
    return;
  }
});

app.get("/api/tasks/:id", async (req: Request, res: Response) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      res.status(404).json({ error: "Task not found" });
      return;
    }
    res.json(task.toJSON());
  } catch (error) {
    console.error("Error finding task:", error);
    res.status(500).json({ error: "Failed to find task" });
  }
});

app.get("/api/users/:userId/tasks", async (req: Request, res: Response) => {
  try {
    const tasks = await Task.findByUserId(req.params.userId);
    res.json(tasks.map((task) => task.toJSON()));
  } catch (error) {
    console.error("Error finding tasks:", error);
    res.status(500).json({ error: "Failed to find tasks" });
  }
});

app.put("/api/tasks/:id", async (req: Request, res: Response) => {
  try {
    const { description } = req.body;

    if (!description) {
      res.status(400).json({ error: "Description is required" });
      return;
    }

    const task = await Task.findById(req.params.id);
    if (!task) {
      res.status(404).json({ error: "Task not found" });
      return;
    }

    task.description = description;
    await task.save();

    res.json(task.toJSON());
  } catch (error) {
    console.error("Error updating task:", error);
    res.status(500).json({ error: "Failed to update task" });
  }
});

app.delete("/api/tasks/:id", async (req: Request, res: Response) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      res.status(404).json({ error: "Task not found" });
      return;
    }

    await task.delete();
    res.json({ message: "Task deleted successfully" });
  } catch (error) {
    console.error("Error deleting task:", error);
    res.status(500).json({ error: "Failed to delete task" });
  }
});

// 404 handler
app.use("*", (req: Request, res: Response) => {
  res.status(404).json({ error: "Route not found" });
});

// Error handler
app.use(
  (
    error: Error,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    console.error("Unhandled error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
);

// Initialize database and start server
async function startServer() {
  try {
    // console.log("Initializing database connection...");

    const server = app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📋 Health check: http://localhost:${PORT}/health`);
      console.log(`📚 API endpoints:`);
      console.log(`   POST /api/users - Create user`);
      console.log(`   GET  /api/users/:id - Get user by ID`);
      console.log(
        `   GET  /api/users/username/:username - Get user by username`
      );
      console.log(`   POST /api/auth/login - Login user`);
      console.log(`   POST /api/tasks - Create task`);
      console.log(`   GET  /api/tasks/:id - Get task by ID`);
      console.log(`   GET  /api/users/:userId/tasks - Get user's tasks`);
      console.log(`   PUT  /api/tasks/:id - Update task`);
      console.log(`   DELETE /api/tasks/:id - Delete task`);
    });

    // Graceful shutdown handlers
    const gracefulShutdown = async (signal: string) => {
      console.log(`\n${signal} received, shutting down gracefully...`);

      server.close(async () => {
        try {
          // await closeDatabase();
          console.log("✅ Server shut down complete");
          process.exit(0);
        } catch (error) {
          console.error("❌ Error during shutdown:", error);
          process.exit(1);
        }
      });

      // Force close after 10 seconds
      setTimeout(() => {
        console.error(
          "❌ Could not close connections in time, forcefully shutting down"
        );
        process.exit(1);
      }, 10000);
    };

    process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
    process.on("SIGINT", () => gracefulShutdown("SIGINT"));
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
}

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
  process.exit(1);
});

// Start the server
startServer();
