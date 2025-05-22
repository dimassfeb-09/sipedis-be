// src/routes/auth_routes.ts
import { ServerRoute } from "@hapi/hapi";
import {
  signUpHandler,
  signInHandler,
  userDetailHandler,
} from "../controller/auth_controller";
import { verifyToken } from "../middleware/auth";

export const authRoutes: ServerRoute[] = [
  {
    method: "POST",
    path: "/signup",
    handler: signUpHandler,
  },
  {
    method: "POST",
    path: "/signin",
    handler: signInHandler,
  },
  {
    method: "GET",
    path: "/me",
    options: {
      pre: [{ method: verifyToken }],
    },
    handler: userDetailHandler,
  },
];
