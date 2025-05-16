import { UserModel } from "../model/User";
import { Pool } from "pg";
import bcrypt from "bcrypt";
import { generateJWT } from "../helper/jwt";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

export default class ChatRepository {
  async createRoom(db: Pool, userId: number) {
    const result = await db.query(
      "INSERT INTO rooms(owner_id) VALUES ($1) RETURNING id",
      [userId]
    );
    return result.rows[0].id;
  }

  async getRoomByID(db: Pool, id: string) {
    const result = await db.query("SELECT * FROM rooms WHERE id = $1", [id]);
    if (result.rows.length === 0) {
      return null;
    }
    return result.rows[0];
  }

  async getMessagesByRoomID(db: Pool, roomId: number) {
    const result = await db.query(
      `SELECT id, room_id, user_id, content, sender_type, created_at
     FROM messages
     WHERE room_id = $1
     ORDER BY created_at ASC`,
      [roomId]
    );
    return result.rows;
  }

  async createMessage(
    db: Pool,
    message: {
      roomId: number;
      userId: number | null;
      content: string;
      senderType: "user" | "bot";
    }
  ) {
    try {
      const result = await db.query(
        `INSERT INTO messages (room_id, user_id, content, sender_type, created_at)
       VALUES ($1, $2, $3, $4, NOW()) RETURNING id, room_id, user_id, content, sender_type, created_at`,
        [message.roomId, message.userId, message.content, message.senderType]
      );

      return result.rows[0];
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error("Create message failed:", error.message);
        throw new Error(error.message || "Failed to create message");
      } else {
        console.error("Create message failed:", error);
        throw new Error("Failed to create message");
      }
    }
  }
}
