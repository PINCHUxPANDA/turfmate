import http from 'http';
import dotenv from 'dotenv';
import app from './app';
import { initSocket } from './sockets/socket';

dotenv.config();

const server = http.createServer(app);
initSocket(server);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`TurfMate Server + Socket.io running on http://localhost:${PORT}`);
});