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
  console.log(`🚀 Server running on http://0.0.0.0:${PORT}`);
  startSelfPing();
});

function startSelfPing() {
  const interval = 1000 * 60 * 1; // Every 1 minute
  setInterval(() => {
    http
      .get(SELF_URL, (res) => {
        console.log(
          `[PING] Status ${res.statusCode} at ${new Date().toISOString()}`
        );
      })
      .on("error", (err) => {
        console.error(`[PING ERROR] ${err.message}`);
      });
  }, interval);
}
