import { Server as SocketIOServer } from "socket.io";

export const initSocket = (server) => {
  const io = new SocketIOServer(server, {
    cors: { origin: "*" },
  });

  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("joinRoom", (conversationId) => {
      socket.join(conversationId);
    });

    socket.on("sendMessage", ({ conversationId, message }) => {
      socket
        .to(conversationId)
        .emit("newMessage", { ...message, conversationId });
    });
  });

  return io;
};
