import { Request, ResponseToolkit } from "@hapi/hapi";
import { validateJWT } from "../helper/jwt";

export const verifyToken = async (request: Request, h: ResponseToolkit) => {
  try {
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return h
        .response({ status: "fail", message: "Missing or invalid token" })
        .code(401)
        .takeover();
    }

    const token = authHeader.split(" ")[1];

    const decoded = validateJWT(token);

    if (
      typeof decoded === "object" &&
      decoded !== null &&
      "id" in decoded &&
      "email" in decoded &&
      "name" in decoded
    ) {
      request.plugins.authUser = decoded as {
        id: string;
        email: string;
        name: string;
      };
    } else {
      return h
        .response({ status: "fail", message: "Invalid token payload" })
        .code(401)
        .takeover();
    }

    return h.continue;
  } catch (error) {
    // Log error di server untuk debugging
    console.error("JWT Verification Error:", error);

    return h
      .response({ status: "fail", message: "Unauthorized" })
      .code(401)
      .takeover();
  }
};
