import express from "express";
const app = express();
import http from "http";
import cors from "cors";

const server = http.createServer(app);
const SELF_URL = process.env.SELF_URL || `http://localhost:8000/ping`;
import { Server } from "socket.io";
import { UserManager } from "./managers/userManager";

app.use(
  cors({
    origin: "*",
  })
);
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

app.get("/", (_req, res) => {
  res.send("All Systems Normal!");
});
app.get("/ping", (_req, res) => {
  res.send("pong");
});
const userManager = new UserManager();

io.on("connection", (socket) => {

  userManager.addUser("user", socket);
  socket.on("disconnect", () => {
  

    userManager.removeUser(socket.id);
  });
});

server.listen(8000, () => {
  console.log("server running..");
  startSelfPing();
});

function startSelfPing() {
  const interval = 1000 * 60 * 4; // Every 4 minutes
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
