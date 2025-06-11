// lib/rateLimiter.js
import { Redis } from '@upstash/redis';
import { rateLimit } from 'next-rate-limit';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

const limiter = rateLimit({
  redis,
  limit: 50,              // e.g. 50 requests
  interval: 60 * 1000,     // per 60 seconds
});

export default limiter;
