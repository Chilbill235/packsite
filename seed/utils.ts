import { v4 as uuidv4 } from "uuid";

export const logger = {
  info: (msg: string) => console.log(`[${new Date().toISOString()}] [INFO] ${msg}`),
  success: (msg: string) => console.log(`[${new Date().toISOString()}] [SUCCESS] ${msg}`),
  error: (msg: string) => console.error(`[${new Date().toISOString()}] [ERROR] ${msg}`)
};

export const getRandom = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];