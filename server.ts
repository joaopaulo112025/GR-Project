import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, setDoc, deleteDoc } from "firebase/firestore";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Initialize Firebase with the provisioned configuration
  const configPath = path.join(process.cwd(), "firebase-applet-config.json");
  const firebaseConfig = JSON.parse(fs.readFileSync(configPath, "utf-8"));

  const firebaseApp = initializeApp(firebaseConfig);
  const db = getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId);

  enum OperationType {
    CREATE = "create",
    UPDATE = "update",
    DELETE = "delete",
    LIST = "list",
    GET = "get",
    WRITE = "write",
  }

  interface FirestoreErrorInfo {
    error: string;
    operationType: OperationType;
    path: string | null;
    authInfo: {
      userId?: string | null;
      email?: string | null;
      emailVerified?: boolean | null;
      isAnonymous?: boolean | null;
      tenantId?: string | null;
      providerInfo?: {
        providerId?: string | null;
        email?: string | null;
      }[];
    }
  }

  function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
    const errInfo: FirestoreErrorInfo = {
      error: error instanceof Error ? error.message : String(error),
      authInfo: {
        userId: null,
        email: null,
        emailVerified: null,
        isAnonymous: null,
        tenantId: null,
        providerInfo: []
      },
      operationType,
      path
    };
    console.error("Firestore Error: ", JSON.stringify(errInfo));
    throw new Error(JSON.stringify(errInfo));
  }

  // Helper functions for Firestore storage
  const loadSchedulesFromFirestore = async () => {
    try {
      const qSnapshot = await getDocs(collection(db, "schedules"));
      const list: any[] = [];
      qSnapshot.forEach((docRef) => {
        list.push({ id: docRef.id, ...docRef.data() });
      });
      return list;
    } catch (e) {
      handleFirestoreError(e, OperationType.GET, "schedules");
    }
  };

  const saveScheduleToFirestore = async (schedule: any) => {
    try {
      await setDoc(doc(db, "schedules", schedule.id), schedule);
      return true;
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, `schedules/${schedule.id}`);
    }
  };

  const deleteScheduleFromFirestore = async (id: string) => {
    try {
      await deleteDoc(doc(db, "schedules", id));
      return true;
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `schedules/${id}`);
    }
  };

  // Seed relative to today if empty
  const today = new Date();
  const formatDateOffset = (days: number) => {
    const target = new Date(today);
    target.setDate(today.getDate() + days);
    const y = target.getFullYear();
    const m = String(target.getMonth() + 1).padStart(2, "0");
    const d = String(target.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };

  const seedFirestoreIfEmpty = async () => {
    try {
      const current = await loadSchedulesFromFirestore();
      if (current.length === 0) {
        console.log("Firestore está sem agendamentos. Criando dados iniciais de teste...");
        const seedData = [
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
        for (const item of seedData) {
          await saveScheduleToFirestore(item);
        }
        console.log("Seeding inicial concluído no Firestore.");
      }
    } catch (e) {
      console.error("Erro no seeding do Firestore:", e);
    }
  };

  // Run seeding as background promise
  seedFirestoreIfEmpty();

  // API endpoints mapping to Firestore
  app.get("/api/schedules", async (req, res) => {
    try {
      const list = await loadSchedulesFromFirestore();
      res.json(list || []);
    } catch (e) {
      console.error("Erro na API GET /api/schedules:", e);
      res.status(500).json({ error: e instanceof Error ? e.message : String(e) });
    }
  });

  app.post("/api/schedules", async (req, res) => {
    try {
      const newSchedule = req.body;
      await saveScheduleToFirestore(newSchedule);
      res.status(201).json(newSchedule);
    } catch (e) {
      console.error("Erro na API POST /api/schedules:", e);
      res.status(500).json({ error: e instanceof Error ? e.message : String(e) });
    }
  });

  app.delete("/api/schedules/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await deleteScheduleFromFirestore(id);
      res.json({ success: true });
    } catch (e) {
      console.error(`Erro na API DELETE /api/schedules/${req.params.id}:`, e);
      res.status(500).json({ error: e instanceof Error ? e.message : String(e) });
    }
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
