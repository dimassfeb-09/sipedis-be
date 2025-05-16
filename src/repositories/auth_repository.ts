import { UserModel } from "../model/User";
import { Pool } from "pg";
import bcrypt from "bcrypt";
import { generateJWT } from "../helper/jwt";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

export default class AuthRepository {
  async signUp(db: Pool, user: UserModel): Promise<any> {
    try {
      // Cek apakah email sudah terdaftar
      const isEmailAlreadyExists = await db.query(
        "SELECT id, email, password FROM users WHERE email = $1",
        [user.email]
      );

      const userResult = isEmailAlreadyExists.rows[0];
      if (userResult) throw new Error("Email already exists");

      // Hash password sebelum disimpan di database
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(user.password, saltRounds);

      // Simpan data user baru ke database
      const result = await db.query(
        "INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id, email, name",
        [user.name, user.email, hashedPassword]
      );

      // Setelah berhasil signup, generate token JWT
      const token = generateJWT({
        id: result.rows[0].id,
        email: result.rows[0].email,
        name: result.rows[0].name,
      });

      return {
        user: result.rows[0],
        token,
      };
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error("Sign up failed:", error.message);
        throw new Error(error.message || "Failed to sign up");
      } else {
        console.error("Sign up failed:", error);
        throw new Error("Failed to sign up");
      }
    }
  }

  // Fungsi untuk sign in user
  async signIn(db: Pool, user: UserModel): Promise<any> {
    try {
      // Ambil user berdasarkan email dari database
      const result = await db.query(
        "SELECT id, email, password, name FROM users WHERE email = $1",
        [user.email]
      );

      const userResult = result.rows[0];
      if (!userResult) throw new Error("User not found");

      // Bandingkan password yang dimasukkan dengan yang ada di database
      const isPasswordValid = await bcrypt.compare(
        user.password,
        userResult.password
      );
      if (!isPasswordValid) throw new Error("Invalid credentials");

      // Generate JWT menggunakan helper
      const token = generateJWT({
        id: userResult.id,
        email: userResult.email,
        name: userResult.name,
      });

      return {
        token,
      };
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error("Sign in failed:", error.message);
        throw new Error(error.message || "Failed to sign in");
      } else {
        console.error("Sign in failed:", error);
        throw new Error("Failed to sign in");
      }
    }
  }
}
