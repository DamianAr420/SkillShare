import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import User from "./models/User.js";
import Conversation from "./models/Conversation.js";
import { createClient } from "redis"; // Import klienta Redis
import { createAdapter } from "@socket.io/redis-adapter"; // Import Adaptera

let io;

export const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      // Upewnij się, że ten origin jest poprawny
      origin: "https://damianar420.github.io",
      credentials: true,
    },
  });

  // --- KONFIGURACJA REDIS ADAPTERA ---
  const redisUrl = process.env.REDIS_URL;

  if (redisUrl) {
    console.log("Redis URL found. Initializing Redis Adapter...");

    const pubClient = createClient({ url: redisUrl });
    const subClient = pubClient.duplicate();

    // Obsługa błędów Redis (ważne, jeśli Redis padnie)
    pubClient.on("error", (err) =>
      console.error("Redis Pub Client Error:", err)
    );
    subClient.on("error", (err) =>
      console.error("Redis Sub Client Error:", err)
    );

    // Połącz klientów Redis
    Promise.all([pubClient.connect(), subClient.connect()])
      .then(() => {
        // Ustaw Adapter
        io.adapter(createAdapter(pubClient, subClient));
        console.log(
          "Socket.IO successfully configured with Redis Adapter (Multi-Instance support enabled)."
        );
      })
      .catch((err) => {
        console.error("Failed to connect Redis clients (FATAL):", err);
        // Serwer uruchomi się w trybie single-instance, ale będzie logował błąd.
      });
  } else {
    console.warn(
      "REDIS_URL not found. Running Socket.IO in single-instance mode (Likely to fail on Render scaling)."
    );
  }
  // -----------------------------------

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error("Unauthorized"));

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.userId;
      next();
    } catch {
      next(new Error("Invalid token"));
    }
  });

  io.on("connection", async (socket) => {
    const userId = socket.userId;

    // ... reszta logiki on connection jest bez zmian ...
    await User.findByIdAndUpdate(userId, {
      isOnline: true,
      lastSeen: new Date(),
    });

    socket.broadcast.emit("userStatus", {
      userId,
      isOnline: true,
    });

    socket.on("joinRoom", (conversationId) => {
      console.log(`[SOCKET] User ${userId} joining room: ${conversationId}`); // Możesz to usunąć po testach
      socket.join(conversationId);
    });

    socket.on("markRead", async ({ conversationId }) => {
      // ... (logika markRead jest OK)
      const conv = await Conversation.findById(conversationId);
      if (!conv) return;

      let updated = false;

      conv.messages.forEach((msg) => {
        if (!msg.readBy.includes(userId)) {
          msg.readBy.push(userId);
          updated = true;
        }
      });

      if (updated) {
        await conv.save();
        // Ta wiadomość również zostanie rozesłana przez Redis
        io.to(conversationId).emit("messagesRead", {
          conversationId,
          userId,
        });
      }
    });

    socket.on("disconnect", async () => {
      await User.findByIdAndUpdate(userId, {
        isOnline: false,
        lastSeen: new Date(),
      });

      socket.broadcast.emit("userStatus", {
        userId,
        isOnline: false,
        lastSeen: new Date(),
      });
    });
  });

  return io;
};

export { io };
