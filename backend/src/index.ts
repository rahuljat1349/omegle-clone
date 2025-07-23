import express from "express";
const app = express();
import http from "http";
import cors from "cors";

const server = http.createServer(app);

import { Server } from "socket.io";
import { UserManager } from "./managers/userManager";
import { RoomManager } from "./managers/roomManager";

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

app.get("/", (req, res) => {
  res.send("Hello");
});
const userManager = new UserManager();

io.on("connection", (socket) => {
  console.log("a user connected.");
  userManager.addUser("user", socket);
  socket.on("disconnect", () => {
    console.log("hung up");
    
   
    userManager.removeUser(socket.id);
  });
});

server.listen(8000, () => {
  console.log("Listening on *:8000");
});
