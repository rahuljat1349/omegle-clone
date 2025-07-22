import { User } from "./userManager";

interface Room {
  user1: User;
  user2: User;
}
let GLOBAL_ROOM_ID = 0;
export class RoomManager {
  private rooms: Map<string, Room>;
  constructor() {
    this.rooms = new Map<string, Room>();
  }

  createRoom(user1: User, user2: User) {
    const roomId = this.generate().toString();
    this.rooms.set(roomId.toString(), { user1, user2 });

    user1.socket.emit("send-offer", {
      roomId,
    });
    user2.socket.emit("send-offer", {
      roomId,
    });
  }

  onOffer(roomId: string, sdp: string, senderSocketId: string, name: string) {
    const room = this.rooms.get(roomId);
    if (!room) {
      return;
    }
    const receivingUser =
      room?.user1.socket.id === senderSocketId ? room.user2 : room?.user1;

    receivingUser?.socket.emit("offer", { sdp, roomId, name });
  }
  onAnswer(roomId: string, sdp: string, receiverSocketId: string) {
    const room = this.rooms.get(roomId);
    if (!room) {
      return;
    }
    const sendingUser =
      room?.user1.socket.id === receiverSocketId ? room.user2 : room?.user1;
    sendingUser?.socket.emit("answer", { sdp, roomId });
  }

  onIceCandidate(
    roomId: string,
    senderSocketId: string,
    candidate: any,
    type: "sender" | "receiver"
  ) {
    const room = this.rooms.get(roomId);
    if (!room) {
      return;
    }
    const receivingUser =
      room?.user1.socket.id === senderSocketId ? room.user2 : room?.user1;
    receivingUser.socket.emit("add-ice-candidate", { candidate, type });
  }

  onMediaStatus(
    roomId : string,
    status: boolean,
    type: "audio" | "video",
    senderSocketId: string
  ) {
   
    const room = this.rooms.get(roomId);

    

    if (!room) {
      return;
    }
    const receivingUser =
      room?.user1.socket.id === senderSocketId ? room.user2 : room?.user1;
    receivingUser.socket.emit("mediaStatus", { status, type });
  }

  generate() {
    return GLOBAL_ROOM_ID++;
  }
}
