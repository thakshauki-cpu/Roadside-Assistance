import { io } from "socket.io-client";

let socket = null;
const activeRequestRooms = new Set();

const getAuthToken = () =>
  localStorage.getItem("token") ||
  sessionStorage.getItem("token") ||
  localStorage.getItem("adminToken") ||
  sessionStorage.getItem("adminToken") ||
  null;

export const getSocket = () => {
  const token = getAuthToken();
  if (!token) {
    return null;
  }

  if (!socket) {
    const serverUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";

    socket = io(serverUrl, {
      auth: { token },
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 15,
      reconnectionDelay: 1000,
    });

    socket.on("connect", () => {
      // Rejoin only authorized request rooms after reconnect
      activeRequestRooms.forEach((requestId) => {
        socket.emit("join_request", requestId);
      });
    });
  } else {
    if (socket.auth?.token !== token) {
      socket.auth = { token };
      if (socket.connected) {
        socket.disconnect();
      }
      socket.connect();
    } else if (!socket.connected) {
      socket.connect();
    }
  }

  return socket;
};

export const updateSocketAuth = () => {
  const token = getAuthToken();

  if (!token) {
    disconnectSocket();
    return;
  }

  if (socket) {
    socket.auth = { token };
    if (socket.connected) {
      socket.disconnect();
    }
    socket.connect();
  } else {
    getSocket();
  }
};

export const disconnectSocket = () => {
  activeRequestRooms.clear();
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const joinRequestRoom = (requestId) => {
  if (!requestId) return;
  activeRequestRooms.add(requestId);
  const s = getSocket();
  if (s && s.connected) {
    s.emit("join_request", requestId);
  }
};

export const leaveRequestRoom = (requestId) => {
  if (!requestId) return;
  activeRequestRooms.delete(requestId);
  if (socket && socket.connected) {
    socket.emit("leave_request", requestId);
  }
};

export default getSocket;
