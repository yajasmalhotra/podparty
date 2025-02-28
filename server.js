const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const RSSParser = require('rss-parser');
const cors = require('cors');
const path = require('path');
const { Redis } = require('ioredis');

const app = express();
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

// Create HTTP and Socket.IO servers
const server = http.createServer(app);
const io = socketIo(server, {
  cors: { origin: "*" }
});

// Configure RSSParser to extract itunes:image from channel and item
const parser = new RSSParser({
  customFields: {
    channel: [['image', 'itunesImage']],
    item: [['itunes:image', 'itunesImage']]
  }
});

// Connect to Upstash Redis
const redisUrl = process.env.REDIS_URL || 'redis://default:AWakAAIjcDEwYTU2OTdiYTRlZTk0ZGFkYTU1NDBhNDU2ZGIwODBiOXAxMA@valued-prawn-26276.upstash.io:6379';
const redisClient = new Redis("rediss://default:AWakAAIjcDEwYTU2OTdiYTRlZTk0ZGFkYTU1NDBhNDU2ZGIwODBiOXAxMA@valued-prawn-26276.upstash.io:6379");
redisClient.on('error', (err) => console.error('Redis Client Error', err));

// Helper functions to store and retrieve room state in Redis
async function setRoomState(room, state) {
  await redisClient.set(`room:${room}`, JSON.stringify(state));
}

async function getRoomState(room) {
  const state = await redisClient.get(`room:${room}`);
  return state ? JSON.parse(state) : null;
}

// Endpoint to fetch and parse an RSS feed
app.get('/feed', async (req, res) => {
  const feedUrl = req.query.url;
  if (!feedUrl) {
    return res.status(400).send('Missing feed URL parameter');
  }
  try {
    const feed = await parser.parseURL(feedUrl);
    console.log("Example feed item:", feed.items[0]);
      console.log('Feed image:', feed.image);
    res.json(feed);
  } catch (error) {
    res.status(500).send(error.toString());
  }
});

// Socket.IO event handling with central room state in Redis
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  socket.on('joinRoom', async (room) => {
    socket.join(room);
    console.log(`User ${socket.id} joined room ${room}`);
    // Retrieve and send the room state from Redis, if it exists.
    const roomState = await getRoomState(room);
    if (roomState) {
      socket.emit('currentState', roomState);
    }
  });

  socket.on('episodeChange', async (data) => {
    // Save the new episode state for the room to Redis
    await setRoomState(data.room, data);
    socket.to(data.room).emit('episodeChange', data);
  });

  socket.on('play', async (data) => {
    const state = await getRoomState(data.room) || {};
    state.currentTime = data.currentTime;
    state.playing = true;
    await setRoomState(data.room, state);
    socket.to(data.room).emit('play', data);
  });

  socket.on('pause', async (data) => {
    const state = await getRoomState(data.room) || {};
    state.currentTime = data.currentTime;
    state.playing = false;
    await setRoomState(data.room, state);
    socket.to(data.room).emit('pause', data);
  });

  socket.on('seek', async (data) => {
    const state = await getRoomState(data.room) || {};
    state.currentTime = data.currentTime;
    await setRoomState(data.room, state);
    socket.to(data.room).emit('seek', data);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});