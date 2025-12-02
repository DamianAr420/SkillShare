import { Server as SocketIOServer } from "socket.io";
import User from "./models/User.js";

export const initSocket = (server) => {
  const io = new SocketIOServer(server, {
    cors: { origin: "*" },
  });

  const onlineUsers = new Map();

  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("userOnline", async (userId) => {
      onlineUsers.set(userId, socket.id);

      await User.findByIdAndUpdate(userId, {
        isOnline: true,
        lastSeen: new Date(),
      });

      io.emit("userStatusChanged", {
        userId,
        isOnline: true,
      });
    });

    socket.on("joinRoom", (conversationId) => {
      socket.join(conversationId);
    });

    socket.on("sendMessage", ({ conversationId, message }) => {
      socket
        .to(conversationId)
        .emit("newMessage", { ...message, conversationId });
    });

    socket.on("disconnect", async () => {
      const userId = [...onlineUsers.entries()].find(
        ([, id]) => id === socket.id
      )?.[0];

      if (userId) {
        onlineUsers.delete(userId);

        await User.findByIdAndUpdate(userId, {
          isOnline: false,
          lastSeen: new Date(),
        });

        io.emit("userStatusChanged", {
          userId,
          isOnline: false,
        });
      }
    });
  });

  return io;
};
