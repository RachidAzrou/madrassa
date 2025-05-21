import { createServerlessApp } from './server.ts';

export default async function handler(req, res) {
  const app = await createServerlessApp();
  
  // Vercel serverless handler
  return new Promise((resolve) => {
    app.handle(req, res, resolve);
  });
}