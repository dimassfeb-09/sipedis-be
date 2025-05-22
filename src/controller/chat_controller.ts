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
    if (roomId) {
      const room = await chatRepo.getRoomByID(pool, roomId.toString());
      if (!room) {
        currentRoomId = await chatRepo.createRoom(pool, userId);
      }
    } else {
      currentRoomId = await chatRepo.createRoom(pool, userId);
    }

    let messageContent = content?.trim() || "";
    let imageUrl = null;

    // Jika ada gambar, simpan file dan buat imageUrl
    if (image) {
      const matches = image.match(/^data:(image\/\w+);base64,(.+)$/);
      if (!matches) throw new Error("Invalid base64 image format");

      const ext = matches[1].split("/")[1];
      const data = matches[2];
      const buffer = Buffer.from(data, "base64");

      const filename = `${uuidv4()}.${ext}`;
      const filepath = path.join(__dirname, "..", "uploads", filename);
      await fs.promises.writeFile(filepath, buffer);

      imageUrl = filename; // hanya simpan nama file
    }

    // Validasi: harus ada minimal content atau image
    if (!messageContent && !imageUrl) {
      throw new Error("Message content and image cannot both be empty");
    }

    const userMessage = await chatRepo.createMessage(pool, {
      roomId: currentRoomId!,
      userId,
      content: messageContent || "",
      images: imageUrl,
      senderType: "user",
    });

    const response = await axios.post("http://localhost:3001/chat", {
      image: image?.split("data:image/png;base64,")[1],
      query: messageContent,
    });

    const {
      class_name,
      confidence,
      assistant,
    }: {
      class_name: string | null;
      confidence: string | null;
      assistant: string;
    } = response.data;

    const botReply = assistant;

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
