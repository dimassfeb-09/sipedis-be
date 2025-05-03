// src/controllers/auth_controller.ts
import { Request, ResponseToolkit } from "@hapi/hapi";
import { pool } from "../config/db";
import AuthRepository from "../repositories/auth_repository";

const authRepo = new AuthRepository();

export const signUpHandler = async (request: Request, h: ResponseToolkit) => {
  const { name, email, password } = request.payload as any;
  try {
    const user = await authRepo.signUp(pool, { name, email, password });
    return h.response({ status: "success", user }).code(201);
  } catch (error: any) {
    return h.response({ status: "fail", message: error.message }).code(400);
  }
};

export const signInHandler = async (request: Request, h: ResponseToolkit) => {
  const { email, password } = request.payload as any;
  try {
    const token = await authRepo.signIn(pool, { email, password });
    return h.response({ status: "success", data: token }).code(200);
  } catch (error: any) {
    return h.response({ status: "fail", message: error.message }).code(401);
  }
};
