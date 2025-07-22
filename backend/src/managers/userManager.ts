import { Socket } from "socket.io";
import { RoomManager } from "./roomManager";

export interface User {
  name: string;
  socket: Socket;
}

export class UserManager {
  private users: User[];
  private roomManager: RoomManager;
  private queue: String[]; // users who asked to join
  constructor() {
    this.users = [];
    this.queue = [];
    this.roomManager = new RoomManager();
  }

  addUser(name: string, socket: Socket) {
    this.users.push({ name, socket });
    this.queue.push(socket.id);
    socket.send("lobby");
    this.clearQueue();
    this.initHandlers(socket);
  }
  removeUser(socketId: string) {
    this.users = this.users.filter((x) => x.socket.id !== socketId);
    this.queue = this.queue.filter((x) => x !== socketId);
    console.log("a user disconnected");
  }
  clearQueue() {
    if (this.queue.length < 2) {
      return;
    }
    const id1 = this.queue.pop();
    const id2 = this.queue.pop();
    const user1 = this.users.find((x) => x.socket.id === id1);
    const user2 = this.users.find((x) => x.socket.id === id2);
    //
    if (!user1 || !user2) {
      return;
    }
    console.log("creating room..");

    const room = this.roomManager.createRoom(user1, user2);
  }

  initHandlers(socket: Socket) {
    socket.on(
      "offer",
      ({
        roomId,
        sdp,
        name,
      }: {
        roomId: string;
        sdp: string;
        name: string;
      }) => {
        this.roomManager.onOffer(roomId, sdp, socket.id, name);
        console.log("offer received from", name);
      }
    );

    socket.on("answer", ({ roomId, sdp }: { roomId: string; sdp: string }) => {
      this.roomManager.onAnswer(roomId, sdp, socket.id);
      console.log("answer received..");
      
    });

    socket.on("mediaStatus", ({roomId, status, type }) => {
      this.roomManager.onMediaStatus(roomId, status, type, socket.id);
      console.log(status, type);
    });

    socket.on("add-ice-candidate", ({ roomId, candidate, type }) => {
      this.roomManager.onIceCandidate(roomId, socket.id, candidate, type);
      console.log("got ice candidate of", type);
    });
  }
}
