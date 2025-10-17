import express from "express";
import cors from "cors";
import morgan from "morgan";
import authRoutes from "./routes/auth/auth.routes.js";
import userRoutes from "./routes/adminrouter/user.routes.js";
import roleRoutes from "./routes/auth/role.routes.js";
import binRoutes from "./routes/bin/bin.routes.js";
import collectionRoutes from "./routes/collection/collection.routes.js";
import historyRoutes from "./routes/history/history.routes.js";
import assignmentRoutes from "./routes/assignment/assignment.routes.js";
import { errorHandler } from "./middleware/error.middleware.js";

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

// Test route
app.get("/", (req, res) => {
  res.json({ message: "Backend is running successfully ✅" });
});

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/roles", roleRoutes);
app.use("/api/bins", binRoutes);
app.use("/api/collections", collectionRoutes);
app.use("/api/assignments", assignmentRoutes);
app.use("/api/history", historyRoutes);

// Error handler
app.use(errorHandler);

export default app;
