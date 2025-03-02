import 'dotenv/config';

import express from 'express';
import http from 'http';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { Server } from 'socket.io';

import feedRouter from './routes/feed.js';
import { setupSocket } from './sockets/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

// Mount the feed route
app.use('/feed', feedRouter);

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

// Set up Socket.IO events
setupSocket(io);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});