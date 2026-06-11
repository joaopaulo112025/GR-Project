import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  const DATA_FILE = path.join(process.cwd(), "schedules.json");

  // Load schedules helper
  const loadSchedules = () => {
    if (fs.existsSync(DATA_FILE)) {
      try {
        return JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
      } catch (e) {
        console.error("Erro ao ler arquivo de agendamentos:", e);
      }
    }
    return [];
  };

  // Save schedules helper
  const saveSchedules = (data: any) => {
    try {
      fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf-8");
    } catch (e) {
      console.error("Erro ao salvar arquivo de agendamentos:", e);
    }
  };

  // Seed relative to today if empty
  const today = new Date();
  const formatDateOffset = (days: number) => {
    const target = new Date(today);
    target.setDate(today.getDate() + days);
    return target.toISOString().split("T")[0];
  };

  let schedules = loadSchedules();
  if (schedules.length === 0) {
    schedules = [
      {
        id: "seed-1",
        vendedor: "Carlos Silva",
        projeto: "GR Plano de ação",
        data: formatDateOffset(0), // Today
        horario: "09:00",
        createdAt: new Date().toISOString(),
      },
      {
        id: "seed-2",
        vendedor: "Mariana Mendes",
        projeto: "GR Plano de ação",
        data: formatDateOffset(0), // Today
        horario: "14:30",
        createdAt: new Date().toISOString(),
      },
      {
        id: "seed-3",
        vendedor: "Roberto Souza",
        projeto: "GR Plano de ação",
        data: formatDateOffset(1), // Tomorrow
        horario: "10:00",
        createdAt: new Date().toISOString(),
      },
    ];
    saveSchedules(schedules);
  }

  // API endpoints
  app.get("/api/schedules", (req, res) => {
    res.json(loadSchedules());
  });

  app.post("/api/schedules", (req, res) => {
    const newSchedule = req.body;
    const current = loadSchedules();
    const updated = [newSchedule, ...current];
    saveSchedules(updated);
    res.status(201).json(newSchedule);
  });

  app.delete("/api/schedules/:id", (req, res) => {
    const { id } = req.params;
    const current = loadSchedules();
    const updated = current.filter((s: any) => s.id !== id);
    saveSchedules(updated);
    res.json({ success: true });
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
