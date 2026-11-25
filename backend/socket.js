import { Server } from "socket.io";
import jwt from "jsonwebtoken";

let io = null;

export const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
      credentials: true,
    },
  });

  // Optional socket authentication
  io.use((socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.replace("Bearer ", "");

      if (token) {
        // Try user JWT first
        try {
          const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET || "roadmate_secret_key"
          );
          socket.user = decoded;
          return next();
        } catch {
          // Try admin JWT
          if (process.env.ADMIN_JWT_SECRET) {
            try {
              const decodedAdmin = jwt.verify(
                token,
                process.env.ADMIN_JWT_SECRET
              );
              socket.user = { ...decodedAdmin, role: "admin" };
              return next();
            } catch {
              // Allow unauthenticated connection with guest socket
            }
          }
        }
      }
      return next();
    } catch {
      return next();
    }
  });

  io.on("connection", (socket) => {
    const user = socket.user;

    if (user?.id) {
      // User room
      socket.join(`user_${user.id}`);

      // Role rooms
      if (user.role === "mechanic") {
        socket.join("role_mechanic");
      } else if (user.role === "admin") {
        socket.join("role_admin");
      } else if (user.role === "customer") {
        socket.join("role_customer");
      }
    }

    // Join / leave specific service request rooms
    socket.on("join_request", (requestId) => {
      if (requestId) {
        socket.join(`request_${requestId}`);
      }
    });

    socket.on("leave_request", (requestId) => {
      if (requestId) {
        socket.leave(`request_${requestId}`);
      }
    });

    socket.on("disconnect", () => {
      // Clean up if needed
    });
  });

  return io;
};

export const getIO = () => io;

export const emitToUser = (userId, event, data) => {
  if (io && userId) {
    io.to(`user_${userId.toString()}`).emit(event, data);
  }
};

export const emitToMechanics = (event, data) => {
  if (io) {
    io.to("role_mechanic").emit(event, data);
  }
};

export const emitToAdmins = (event, data) => {
  if (io) {
    io.to("role_admin").emit(event, data);
  }
};

export const emitToRequest = (requestId, event, data) => {
  if (io && requestId) {
    io.to(`request_${requestId.toString()}`).emit(event, data);
  }
};

export const emitGlobal = (event, data) => {
  if (io) {
    io.emit(event, data);
  }
};
