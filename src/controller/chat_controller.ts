import fs from "fs";
import path, { format } from "path";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import { Request, ResponseToolkit } from "@hapi/hapi";
import { pool } from "../config/db";
import ChatRepository from "../repositories/chat_repository";

const chatRepo = new ChatRepository();

export const chatHandler = async (request: Request, h: ResponseToolkit) => {
  const userId = request.plugins.authUser?.id ?? 0;

  const { roomId, content, imageBase64 } = request.payload as {
    roomId?: number;
    content?: string;
    imageBase64?: string;
  };

  try {
    // Pastikan room ada / buat baru jika belum ada
    let currentRoomId = roomId;
    if (roomId) {
      const room = await chatRepo.getRoomByID(pool, roomId.toString());
      if (!room) {
        currentRoomId = await chatRepo.createRoom(pool, userId);
      }
    } else {
      currentRoomId = await chatRepo.createRoom(pool, userId);
    }

    // Proses isi pesan, termasuk image (opsional)
    let messageContent = content || "";

    if (imageBase64) {
      const matches = imageBase64.match(/^data:(image\/\w+);base64,(.+)$/);
      if (!matches) throw new Error("Invalid base64 image format");

      const ext = matches[1].split("/")[1];
      const data = matches[2];
      const buffer = Buffer.from(data, "base64");

      const filename = `${uuidv4()}.${ext}`;
      const filepath = path.join(__dirname, "..", "uploads", filename);
      await fs.promises.writeFile(filepath, buffer);

      const imageUrl = `/uploads/${filename}`;
      messageContent += messageContent
        ? `\nImage: ${imageUrl}`
        : `Image: ${imageUrl}`;
    }

    if (!messageContent.trim()) throw new Error("Message content is empty");

    // Simpan pesan user ke DB
    const userMessage = await chatRepo.createMessage(pool, {
      roomId: currentRoomId!,
      userId,
      content: messageContent,
      senderType: "user",
    });

    // Ambil semua pesan sebelumnya dari DB sebagai konteks
    const previousMessages = await chatRepo.getMessagesByRoomID(
      pool,
      currentRoomId!
    );

    const formattedMessages = previousMessages.map((m) => ({
      user_type: m.sender_type,
      message: m.content,
    }));

    console.log(formattedMessages); // ini context

    // Kirim ke backend AI via POST
    // const aiResponse = await axios.post(
    //   "http://backend-ai.example.com/api/chat",
    //   formattedMessages,
    //   {
    //     headers: { "Content-Type": "application/json" },
    //   }
    // );

    const aiResponse = {
      message: "ashjdfasghdfas asjhdgasjhdas kocakhgdfasd",
    };

    const botReply = aiResponse.message;

    // Simpan balasan bot ke DB
    const botMessage = await chatRepo.createMessage(pool, {
      roomId: currentRoomId!,
      userId: 0,
      content: botReply,
      senderType: "bot",
    });

    const replyBot = botMessage.content;

    return h
      .response({
        status: "success",
        data: {
          roomId: currentRoomId,
          content: replyBot,
        },
      })
      .code(201);
  } catch (error: any) {
    return h.response({ status: "fail", message: error.message }).code(400);
  }
};
