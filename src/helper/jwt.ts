import jwt, { JwtPayload } from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

export const generateJWT = (payload: {
  id: string;
  email: string;
  name: string;
}): string => {
  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "30d" });
  return token;
};

export const validateJWT = (token: string): JwtPayload | string | null => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded;
  } catch (error) {
    console.error("JWT Validation Error:", error);
    return null;
  }
};
