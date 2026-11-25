import { io } from "socket.io-client";

let socket = null;

export const getSocket = () => {
  if (!socket) {
    const serverUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";
    const token =
      localStorage.getItem("token") ||
      localStorage.getItem("adminToken") ||
      sessionStorage.getItem("adminToken");

    socket = io(serverUrl, {
      auth: { token },
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    socket.on("connect", () => {
      // connected
    });
  }
  return socket;
};

export const updateSocketAuth = () => {
  if (socket) {
    const token =
      localStorage.getItem("token") ||
      localStorage.getItem("adminToken") ||
      sessionStorage.getItem("adminToken");
    socket.auth = { token };
    if (!socket.connected) {
      socket.connect();
    }
  }
};

export const joinRequestRoom = (requestId) => {
  const s = getSocket();
  if (s && requestId) {
    s.emit("join_request", requestId);
  }
};

export const leaveRequestRoom = (requestId) => {
  const s = getSocket();
  if (s && requestId) {
    s.emit("leave_request", requestId);
  }
};

export default getSocket;
