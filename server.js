const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const RSSParser = require('rss-parser');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

const server = http.createServer(app);
const io = socketIo(server, {
  cors: { origin: "*" }
});

// Configure RSSParser to extract itunes:image from both channel and item
const parser = new RSSParser({
  customFields: {
    channel: [['image', 'itunesImage']],
    item: [['itunes:image', 'itunesImage']]
  }
});

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

// Basic socket events for syncing room playback state
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  socket.on('joinRoom', (room) => {
    socket.join(room);
    console.log(`User ${socket.id} joined room ${room}`);
    // Optionally, send current state here if maintained on the server.
  });

  socket.on('episodeChange', (data) => {
    socket.to(data.room).emit('episodeChange', data);
  });

  socket.on('play', (data) => {
    socket.to(data.room).emit('play', data);
  });

  socket.on('pause', (data) => {
    socket.to(data.room).emit('pause', data);
  });

  socket.on('seek', (data) => {
    socket.to(data.room).emit('seek', data);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});