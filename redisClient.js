import { Redis } from 'ioredis';

const redisUrl = process.env.REDIS_URL;
if (!redisUrl) {
  throw new Error("REDIS_URL environment variable not set");
}

// const redisClient = createClient({
//   url: redisUrl,
//   socket: {
//     reconnectStrategy: (retries) => Math.min(retries * 100, 3000),
//     keepAlive: 10000
//   }
// });

// redisClient.on('error', (err) => console.error('Redis Client Error', err));
// await redisClient.connect();

// const redisUrl = process.env.REDIS_URL || 'redis://default:AWakAAIjcDEwYTU2OTdiYTRlZTk0ZGFkYTU1NDBhNDU2ZGIwODBiOXAxMA@valued-prawn-26276.upstash.io:6379';
const redisClient = new Redis("rediss://default:AWakAAIjcDEwYTU2OTdiYTRlZTk0ZGFkYTU1NDBhNDU2ZGIwODBiOXAxMA@valued-prawn-26276.upstash.io:6379");
redisClient.on('error', (err) => console.error('Redis Client Error', err));

export default redisClient;