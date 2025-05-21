import { createServer } from 'http';
import initApp from '../server/index';

export default async function handler(req: any, res: any) {
  // Initialiseer Express app
  const app = await initApp();
  
  // Maak een mock server aanvraag
  const server = createServer();
  
  // Stuur de aanvraag door naar Express
  app(req, res);
}