import redisClient from '../redisClient.js';

async function setRoomState(room, state) {
  await redisClient.set(`room:${room}`, JSON.stringify(state));
}

async function getRoomState(room) {
  const state = await redisClient.get(`room:${room}`);
  return state ? JSON.parse(state) : null;
}

export function setupSocket(io) {
  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    socket.on('joinRoom', async (room) => {
      socket.join(room);
      console.log(`User ${socket.id} joined room ${room}`);
      const roomState = await getRoomState(room);
      if (roomState) {
        socket.emit('currentState', roomState);
      }
    });

    socket.on('episodeChange', async (data) => {
      await setRoomState(data.room, data);
      socket.to(data.room).emit('episodeChange', data);
    });

    socket.on('play', async (data) => {
      const state = (await getRoomState(data.room)) || {};
      state.currentTime = data.currentTime;
      state.playing = true;
      await setRoomState(data.room, state);
      socket.to(data.room).emit('play', data);
    });

    socket.on('pause', async (data) => {
      const state = (await getRoomState(data.room)) || {};
      state.currentTime = data.currentTime;
      state.playing = false;
      await setRoomState(data.room, state);
      socket.to(data.room).emit('pause', data);
    });

    socket.on('seek', async (data) => {
      const state = (await getRoomState(data.room)) || {};
      state.currentTime = data.currentTime;
      await setRoomState(data.room, state);
      socket.to(data.room).emit('seek', data);
    });
  });
}