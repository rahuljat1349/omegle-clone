import express from "express";
const app = express();
import https from "https";
import cors from "cors";

const server = https.createServer(app);
const SELF_URL = process.env.SELF_URL;
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
  const interval = 1000 * 60 * 1; // Every 4 minutes
  setInterval(() => {
    https
      .get(SELF_URL || "https://vibes-sv7l.onrender.com/ping", (res) => {
        console.log(
          `[PING] Status ${res.statusCode} at ${new Date().toISOString()}`
        );
      })
      .on("error", (err) => {
        console.error(`[PING ERROR] ${err.message}`);
      });
  }, interval);
}
