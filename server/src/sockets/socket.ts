import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/db';

interface AuthenticatedSocket extends Socket {
  user?: { userId: string; role: string };
}

let io: Server;

export const initSocket = (httpServer: HttpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:3000',
      credentials: true,
    },
  });

  // Optional JWT Middleware for Socket connections
  io.use((socket: AuthenticatedSocket, next) => {
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.headers.cookie
        ?.split('; ')
        .find((row) => row.startsWith('token='))
        ?.split('=')[1];

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
          userId: string;
          role: string;
        };
        socket.user = decoded;
      } catch {
        // Allow read-only viewing of lobbies even if unauthenticated
      }
    }
    next();
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    console.log(`Socket connected: ${socket.id}`);

    // 1. Join a specific match lobby room
    socket.on('join_match_room', (matchId: string) => {
      socket.join(`match:${matchId}`);
    });

    // 2. Leave a match lobby room
    socket.on('leave_match_room', (matchId: string) => {
      socket.leave(`match:${matchId}`);
    });

    // 3. Real-Time Match Lobby Chat (Module D)
    socket.on(
      'send_message',
      async (payload: { matchId: string; senderId: string; message: string }) => {
        try {
          const senderId = socket.user?.userId || payload.senderId;
          if (!senderId || !payload.message?.trim()) return;

          // Verify user is a participant in this match before allowing chat
          const isParticipant = await prisma.matchParticipant.findUnique({
            where: {
              matchId_userId: { matchId: payload.matchId, userId: senderId },
            },
          });

          if (!isParticipant) {
            socket.emit('chat_error', { message: 'Join the match lobby to send messages.' });
            return;
          }

          // Save message to PostgreSQL
          const savedMessage = await prisma.chatMessage.create({
            data: {
              matchId: payload.matchId,
              senderId,
              message: payload.message.trim(),
            },
            include: {
              sender: { select: { id: true, name: true, avatarUrl: true } },
            },
          });

          // Broadcast to everyone in that match room
          io.to(`match:${payload.matchId}`).emit('receive_message', savedMessage);
        } catch (err) {
          console.error('Socket send_message error:', err);
          socket.emit('chat_error', { message: 'Failed to send message.' });
        }
      }
    );

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });

  return io;
};

// Helper to emit live slot updates from REST controllers
export const getIO = () => {
  if (!io) throw new Error('Socket.io not initialized');
  return io;
};