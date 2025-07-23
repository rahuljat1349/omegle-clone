import express from "express";
import http from "http";
import cors from "cors";
import { Server } from "socket.io";
import { UserManager } from "./managers/userManager";

const app = express();
const PORT = process.env.PORT || 8000;
const SELF_URL = process.env.SELF_URL || `http://localhost:${PORT}/ping`;

const server = http.createServer(app); 

app.use(cors({ origin: "*" }));

const io = new Server(server, {
  cors: { origin: "*" },
});

app.get("/", (_req, res) => res.send("All Systems Normal!"));
app.get("/ping", (_req, res) => res.send("pong"));

const userManager = new UserManager();

io.on("connection", (socket) => {
  userManager.addUser("user", socket);
  socket.on("disconnect", () => userManager.removeUser(socket.id));
});

server.listen(PORT,  () => {
  console.log(`🚀 Server running on ${SELF_URL}`);
  pingServer();
});

// Function to ping server
const pingServer = async () => {
  try {
    const response = await fetch(`${SELF_URL}`);
    console.log("Server ping successful:", response.status);
  } catch (error: any) {
    console.error("Server ping failed:", error.message);
  }
};

// Set up ping interval (10 minutes = 600000 milliseconds)
setInterval(pingServer, 600000);
