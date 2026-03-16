import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // API routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", message: "Backend is running!" });
  });

  // Community Stats Endpoint
  app.get("/api/stats", (req, res) => {
    // In a real production app, this might query a database or cache
    res.json({
      totalUsers: 1250,
      facilitiesMapped: 450,
      countriesActive: 12,
      lastUpdate: new Date().toISOString()
    });
  });

  // Feedback Submission Endpoint
  app.post("/api/feedback", express.json(), (req, res) => {
    const { userId, message } = req.body;
    console.log(`Feedback received from ${userId}: ${message}`);
    // In a real app, you'd save this to a database or send an email
    res.json({ success: true, message: "Thank you for your feedback!" });
  });

  // Example AI endpoint (placeholder)
  app.post("/api/chat", express.json(), async (req, res) => {
    const { message } = req.body;
    // In a real app, you'd call Gemini here if you wanted server-side AI
    // But per guidelines, we prefer calling Gemini from the frontend.
    // This is just to demonstrate a POST route.
    res.json({ reply: `Server received: ${message}` });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
