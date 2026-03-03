import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import swaggerUi from "swagger-ui-express";
import { env } from "./config/env.js";
import { errorHandler } from "./middleware/error-handler.js";
import authRoutes from "./modules/auth/routes.js";
import userRoutes from "./modules/users/routes.js";
import categoryRoutes from "./modules/categories/routes.js";
import jobRoutes from "./modules/jobs/routes.js";
import employerRoutes from "./modules/employers/routes.js";
import applicationRoutes from "./modules/applications/routes.js";
import adminRoutes from "./modules/admin/routes.js";
import fileRoutes from "./modules/files/routes.js";
import notificationRoutes from "./modules/notifications/routes.js";
import messageRoutes from "./modules/messages/routes.js";
import { swaggerSpec } from "./config/swagger.js";

export const app = express();

app.use(helmet());
app.use(
  cors({
    origin: [env.webUrl],
    credentials: true
  })
);
app.use(express.json({ limit: "2mb" }));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, limit: 200 }));
app.use("/uploads", express.static(env.localUploadDir));

app.get("/health", (_req, res) => res.json({ ok: true }));
app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/categories", categoryRoutes);
app.use("/api/v1/jobs", jobRoutes);
app.use("/api/v1/employers", employerRoutes);
app.use("/api/v1/applications", applicationRoutes);
app.use("/api/v1/files", fileRoutes);
app.use("/api/v1/notifications", notificationRoutes);
app.use("/api/v1/messages", messageRoutes);
app.use("/admin/api/v1", adminRoutes);

app.use(errorHandler);
