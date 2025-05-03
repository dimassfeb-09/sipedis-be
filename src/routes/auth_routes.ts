// src/routes/auth_routes.ts
import { ServerRoute } from "@hapi/hapi";
import { signUpHandler, signInHandler } from "../controller/auth_controller";

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
];
