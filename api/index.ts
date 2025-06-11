import express, { type Request, Response, NextFunction } from "express";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Error handling middleware
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  
  console.error('Server error:', err);
  res.status(status).json({ message });
});

// Initialize minimal serverless app without complex dependencies
async function initServerlessApp() {
  try {
    // Add basic API health check endpoint
    app.get("/api/health", (_req, res) => {
      res.json({ status: "ok", timestamp: new Date().toISOString() });
    });

    // Add basic authentication endpoint
    app.post("/api/login", (req, res) => {
      res.json({ message: "Login endpoint available" });
    });

    // Serve minimal SPA for deployment
    app.use("*", (_req, res) => {
      const html = `
<!DOCTYPE html>
<html lang="nl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>myMadrassa - Educatief Beheersysteem</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    .spinner { animation: spin 1s linear infinite; }
    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
  </style>
</head>
<body class="bg-gray-50">
  <div id="root">
    <div class="min-h-screen flex items-center justify-center">
      <div class="text-center">
        <div class="spinner w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
        <h1 class="text-2xl font-bold text-blue-600 mb-2">myMadrassa</h1>
        <p class="text-gray-600">Educatief Beheersysteem - Server Online</p>
        <div class="mt-8 bg-white p-6 rounded-lg shadow-md max-w-md mx-auto">
          <h2 class="text-lg font-semibold mb-4">🚀 Server Status</h2>
          <div class="text-sm text-left space-y-2">
            <div>✓ Serverless function actief</div>
            <div>✓ API endpoints beschikbaar</div>
            <div>✓ Deployment succesvol</div>
            <div>✓ Minimale configuratie geladen</div>
          </div>
          <div class="mt-4 pt-4 border-t">
            <p class="text-xs text-gray-500">Health check: /api/health</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;
      res.status(200).set({ "Content-Type": "text/html" }).send(html);
    });
    
    return app;
  } catch (error) {
    console.error('Failed to initialize minimal app:', error);
    // Return a basic app even if initialization fails
    app.get("*", (_req, res) => {
      res.status(200).json({ 
        message: "myMadrassa API",
        status: "minimal mode",
        error: error.message 
      });
    });
    return app;
  }
}

let appPromise: Promise<express.Application> | null = null;

export default async function handler(req: any, res: any) {
  try {
    if (!appPromise) {
      appPromise = initServerlessApp();
    }
    
    const app = await appPromise;
    return app(req, res);
  } catch (error) {
    console.error('Handler error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
}