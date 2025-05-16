// src/routes/auth_routes.ts
import { ServerRoute } from "@hapi/hapi";
import { chatHandler } from "../controller/chat_controller";
import { verifyToken } from "../middleware/auth";

export const chatRoutes: ServerRoute[] = [
  {
    method: "POST",
    path: "/chat",
    options: {
      pre: [{ method: verifyToken }],
    },
    handler: chatHandler,
  },
];
