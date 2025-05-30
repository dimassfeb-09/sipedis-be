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

  const { roomId, content, image } = request.payload as {
    roomId?: number;
    content?: string;
    image?: string;
  };

  try {
    let currentRoomId = roomId;

    // Validasi room jika diberikan
    if (roomId) {
      const room = await chatRepo.getRoomByID(pool, roomId.toString());
      if (!room) {
        currentRoomId = await chatRepo.createRoom(pool, userId);
      }
    } else {
      currentRoomId = await chatRepo.createRoom(pool, userId);
    }

    const trimmedContent = content?.trim() || "";
    let imageUrl: string | null = null;

    // Proses gambar base64 jika ada
    if (image) {
      const matches = image.match(/^data:(image\/\w+);base64,(.+)$/);
      if (!matches) throw new Error("Invalid base64 image format");

      const mimeType = matches[1];
      const base64Data = matches[2];

      const ext = mimeType.split("/")[1];
      const buffer = Buffer.from(base64Data, "base64");

      const filename = `${uuidv4()}.${ext}`;
      const filepath = path.join(__dirname, "..", "uploads", filename);
      await fs.promises.writeFile(filepath, buffer);

      imageUrl = filename;
    }

    // Validasi bahwa minimal content atau image harus ada
    if (!trimmedContent && !imageUrl) {
      throw new Error("Message content and image cannot both be empty");
    }

    // Simpan pesan dari user
    await chatRepo.createMessage(pool, {
      roomId: currentRoomId!,
      userId,
      content: trimmedContent,
      images: imageUrl,
      senderType: "user",
    });

    // Panggil API ML
    const response = await axios.post(
      "https://sipedis-ml-production.up.railway.app/chat",
      {
        image: image?.split("base64,")[1] || null,
        query: trimmedContent,
      }
    );

    const {
      class_name = null,
      confidence = null,
      assistant = "",
    } = response.data.data ?? {};

    const botReply =
      assistant.trim() || "Maaf, saya tidak dapat memberikan jawaban saat ini.";

    const botMessage = await chatRepo.createMessage(pool, {
      roomId: currentRoomId!,
      userId: 0,
      content: botReply,
      senderType: "bot",
      images: null,
    });

    return h
      .response({
        status: "success",
        data: {
          roomId: currentRoomId,
          content: botMessage.content,
          additional: image
            ? {
                className: class_name,
                confidence: confidence,
              }
            : null,
        },
      })
      .code(201);
  } catch (error: any) {
    console.error("Chat handler error:", error.message);
    return h.response({ status: "fail", message: error.message }).code(400);
  }
};

export const getMessagesByRoomIDHandler = async (
  request: Request,
  h: ResponseToolkit
) => {
  const userId = request.plugins.authUser?.id ?? 0;
  const { roomId } = request.params;

  const { owner_id } = await chatRepo.getRoomByID(pool, roomId);

  if (owner_id != userId) {
    return h
      .response({
        status: "error",
        message: `You are not permit to get message in room ${roomId}`,
      })
      .code(401);
  }

  const messages = await chatRepo.getMessagesByRoomID(pool, roomId);

  const formattedMessages = messages.map((message) => ({
    sender_type: message.sender_type,
    content: message.content,
    imagesUrl: message.images
      ? `http://localhost:8080/images/${message.images}`
      : null,
  }));

  return h
    .response({
      status: "success",
      data: formattedMessages,
    })
    .code(200);
};

export const getRoomsByUserIdHandler = async (
  request: Request,
  h: ResponseToolkit
) => {
  try {
    const userId = request.plugins.authUser?.id ?? 0;

    const result = await chatRepo.getRoomsByUserId(pool, userId);

    return h
      .response({
        status: "success",
        data: result.rows,
      })
      .code(200);
  } catch (err: any) {
    console.error("Failed to get chat rooms:", err);
    return h
      .response({
        status: "fail",
        message: err.message || "Internal Server Error",
      })
      .code(500);
  }
};
