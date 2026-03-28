import { Server as SocketServer } from 'socket.io';
import { Server as HttpServer } from 'http';
import jwt from 'jsonwebtoken';
import { AuthPayload } from '../types';

interface AuthSocket {
  user: AuthPayload;
}

export function initSocket(httpServer: HttpServer): SocketServer {
  const io = new SocketServer(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:4200',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth['token'];
    if (!token) {
      next(new Error('Authentication required'));
      return;
    }
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as AuthPayload;
      (socket as unknown as AuthSocket).user = decoded;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const user = (socket as unknown as AuthSocket).user;
    console.log(`Socket connected: ${user.email}`);

    socket.on('join:board', (boardId: string) => {
      socket.join(`board:${boardId}`);
    });

    socket.on('leave:board', (boardId: string) => {
      socket.leave(`board:${boardId}`);
    });

    socket.on('task:created', (data: { boardId: string; task: object }) => {
      socket.to(`board:${data.boardId}`).emit('task:created', data.task);
    });

    socket.on('task:updated', (data: { boardId: string; task: object }) => {
      socket.to(`board:${data.boardId}`).emit('task:updated', data.task);
    });

    socket.on('task:deleted', (data: { boardId: string; taskId: string }) => {
      socket.to(`board:${data.boardId}`).emit('task:deleted', data.taskId);
    });

    socket.on('task:moved', (data: { boardId: string; taskId: string; columnId: string }) => {
      socket.to(`board:${data.boardId}`).emit('task:moved', data);
    });

    socket.on('comment:added', (data: { boardId: string; taskId: string; comment: object }) => {
      socket.to(`board:${data.boardId}`).emit('comment:added', data);
    });

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${user.email}`);
    });
  });

  return io;
}
