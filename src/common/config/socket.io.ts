import { Server } from "socket.io";
import type { Server as NodeServer } from "node:http";
import { corsConfig } from "./cors.config.js";


// Socket.io server instance variable
export let io: Server;

export const initSocket = (nodeServer: NodeServer) => {

    // Create a new socket.io server instance
    io = new Server(nodeServer, {
        cors: corsConfig,
    });

    io.on("connection", (socket) => {
        console.log(`A new socket connected on: ${socket.id}`);

        // Listen for a client joining a specific poll's room
        socket.on("join_poll", (slug: string) => {
            if (slug) {
                socket.join(`poll_${slug}`);
                console.log(`Socket ${socket.id} joined room: poll_${slug}`);
            }
        });

        socket.on("disconnect", () => {
            console.log(`Socket disconnected: ${socket.id}`);
        });
    });
};