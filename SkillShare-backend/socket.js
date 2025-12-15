import { Server as SocketIOServer } from "socket.io";
import User from "./models/User.js";
import Conversation from "./models/Conversation.js";

let io;

export const initSocket = (server) => {
  io = new SocketIOServer(server, {
    cors: { origin: "*" },
  });

  const onlineUsers = new Map();

  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("joinRoom", (conversationId) => {
      socket.join(conversationId);
    });

    socket.on("userOnline", async (userId) => {
      onlineUsers.set(userId, socket.id);
      await User.findByIdAndUpdate(userId, {
        isOnline: true,
        lastSeen: new Date(),
      });

      io.emit("userStatus", { userId, isOnline: true });
    });

    socket.on("heartbeat", async ({ userId }) => {
      const user = await User.findByIdAndUpdate(
        userId,
        { isOnline: true, lastSeen: new Date() },
        { new: true }
      );

      io.emit("userStatus", {
        userId: user._id,
        isOnline: true,
        lastSeen: user.lastSeen,
      });
    });

    socket.on("disconnect", async () => {
      const userId = [...onlineUsers.entries()].find(
        ([, id]) => id === socket.id
      )?.[0];

      if (!userId) return;

      await User.findByIdAndUpdate(userId, {
        isOnline: false,
        lastSeen: new Date(),
      });

      io.emit("userStatus", {
        userId,
        isOnline: false,
        lastSeen: new Date(),
      });
    });

    socket.on("leaveRoom", (id) => socket.leave(id));
  });

  return io;
};

export { io };
