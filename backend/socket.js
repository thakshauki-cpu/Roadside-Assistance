import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import ServiceRequest from "./models/ServiceRequest.js";

let io = null;

const getAllowedOrigins = () =>
  (process.env.CORS_ORIGIN || "http://localhost:5173,http://127.0.0.1:5173")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

const verifySocketToken = (token) => {
  if (!token) return null;

  if (process.env.JWT_SECRET) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      if (decoded?.id) {
        return {
          id: decoded.id.toString(),
          role: decoded.role || "customer",
        };
      }
    } catch {
      // Fall through to admin secret check
    }
  }

  if (process.env.ADMIN_JWT_SECRET) {
    try {
      const decodedAdmin = jwt.verify(token, process.env.ADMIN_JWT_SECRET);
      if (decodedAdmin?.id) {
        return {
          id: decodedAdmin.id.toString(),
          role: "admin",
        };
      }
    } catch {
      // Invalid token
    }
  }

  return null;
};

export const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: getAllowedOrigins(),
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
      credentials: true,
    },
  });

  // Strict JWT authentication — reject unauthenticated or invalid tokens
  io.use((socket, next) => {
    const rawAuth =
      socket.handshake.auth?.token ||
      socket.handshake.headers?.authorization?.replace(/^Bearer\s+/i, "");

    const user = verifySocketToken(rawAuth);
    if (!user) {
      return next(new Error("Authentication failed: valid JWT required."));
    }

    socket.user = user;
    return next();
  });

  io.on("connection", (socket) => {
    const user = socket.user;

    // User-specific room
    socket.join(`user_${user.id}`);

    // Role-based rooms
    if (user.role === "mechanic") {
      socket.join("role_mechanic");
    } else if (user.role === "admin") {
      socket.join("role_admin");
    } else if (user.role === "customer") {
      socket.join("role_customer");
    }

    // Authorize request room join using MongoDB ownership/assignment/admin check
    socket.on("join_request", async (requestId, ack) => {
      try {
        if (!requestId || !mongoose.Types.ObjectId.isValid(requestId)) {
          if (typeof ack === "function") {
            ack({ ok: false, message: "Invalid service request ID." });
          }
          return;
        }

        if (user.role === "admin") {
          socket.join(`request_${requestId}`);
          if (typeof ack === "function") ack({ ok: true, requestId });
          return;
        }

        const request = await ServiceRequest.findById(requestId)
          .select("customer mechanic")
          .lean();

        if (!request) {
          if (typeof ack === "function") {
            ack({ ok: false, message: "Service request not found." });
          }
          return;
        }

        const isCustomerOwner = request.customer?.toString() === user.id;
        const isAssignedMechanic = request.mechanic?.toString() === user.id;

        if (!isCustomerOwner && !isAssignedMechanic) {
          if (typeof ack === "function") {
            ack({ ok: false, message: "Not authorized to join this request room." });
          }
          return;
        }

        socket.join(`request_${requestId}`);
        if (typeof ack === "function") ack({ ok: true, requestId });
      } catch (err) {
        if (typeof ack === "function") {
          ack({ ok: false, message: "Unable to authorize request room." });
        }
      }
    });

    socket.on("leave_request", (requestId) => {
      if (requestId) {
        socket.leave(`request_${requestId}`);
      }
    });

    socket.on("disconnect", () => {
      // Room memberships are cleaned up automatically by Socket.IO
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
