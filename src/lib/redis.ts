import Redis from "ioredis";

// const client = new Redis(process.env.REDIS_URL!);
const client = new Redis();

export default client;
