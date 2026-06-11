import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, setDoc, deleteDoc } from "firebase/firestore";
import nodemailer from "nodemailer";

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

  // Helper to send email notification (with graceful console simulator fallback)
  async function sendEmailNotification(schedule: { vendedor: string; projeto: string; data: string; horario: string }) {
    const emailTo = process.env.EMAIL_NOTIFY_TO || "joao.giaretta@az-armaturen.com.br";
    const host = process.env.SMTP_HOST;
    const port = process.env.SMTP_PORT;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    console.log(`[Email Service] Nova tentativa de envio para ${emailTo}...`);

    if (!host || !user || !pass) {
      console.log("[Email Service] Variáveis SMTP não configuradas no servidor. Ativando simulador de envio para João.");
      console.log(`[Email Simulador] E-mail enviado com sucesso para: ${emailTo}`);
      console.log(`[Email Simulador] Conteúdo: Vendedor=${schedule.vendedor}, Projeto=${schedule.projeto}, Data=${schedule.data}, Horário=${schedule.horario}`);
      return;
    }

    try {
      const transporter = nodemailer.createTransport({
        host: host,
        port: Number(port) || 587,
        secure: process.env.SMTP_SECURE === "true",
        auth: {
          user: user,
          pass: pass,
        },
      });

      // Format date from YYYY-MM-DD to DD/MM/YYYY
      const dateParts = schedule.data.split("-");
      const formattedDate = dateParts.length === 3 ? `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}` : schedule.data;

      const mailOptions = {
        from: `"Portal GR Plano de Ação" <${user}>`,
        to: emailTo,
        subject: `🔔 Novo Agendamento: ${schedule.vendedor} - ${formattedDate}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #1e293b; margin: 0; padding: 0; }
              .container { max-width: 600px; margin: 20px auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05); border: 1px solid #e2e8f0; }
              .header { background: linear-gradient(135deg, #1e3a8a, #3b82f6); padding: 32px 24px; text-align: center; color: #ffffff; }
              .header h1 { margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.5px; }
              .header p { margin: 8px 0 0; opacity: 0.9; font-size: 14px; }
              .content { padding: 32px 24px; }
              .details-box { background-color: #f1f5f9; border-radius: 12px; padding: 20px; margin-bottom: 24px; border: 1px solid #e2e8f0; }
              .detail-row { display: flex; justify-content: space-between; border-bottom: 1px solid #cbd5e1; padding: 10px 0; }
              .detail-row:last-child { border-bottom: none; }
              .label { font-weight: 600; color: #475569; font-size: 14px; }
              .value { color: #0f172a; font-size: 14px; text-align: right; }
              .footer { background-color: #f8fafc; padding: 20px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; }
              .btn { display: inline-block; padding: 12px 24px; background-color: #2563eb; color: #ffffff !important; text-decoration: none; border-radius: 8px; font-weight: 500; font-size: 14px; margin-top: 10px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>GR Plano de Ação</h1>
                <p>Confirmação de Agendamento de Reunião</p>
              </div>
              <div class="content">
                <h2 style="margin-top: 0; font-size: 18px; color: #1e3a8a;">Olá, João!</h2>
                <p>Um novo compromisso de trabalho foi agendado com sucesso no portal de agendamentos. Veja os detalhes abaixo:</p>
                
                <div class="details-box">
                  <div class="detail-row">
                    <span class="label">Vendedor:</span>
                    <span class="value" style="font-weight: 600;">${schedule.vendedor}</span>
                  </div>
                  <div class="detail-row">
                    <span class="label">Projeto:</span>
                    <span class="value">${schedule.projeto}</span>
                  </div>
                  <div class="detail-row">
                    <span class="label">Data da Reunião:</span>
                    <span class="value" style="font-weight: 600; color: #2563eb;">${formattedDate}</span>
                  </div>
                  <div class="detail-row">
                    <span class="label">Horário Solicitado:</span>
                    <span class="value" style="font-weight: 600; color: #2563eb;">${schedule.horario}</span>
                  </div>
                  <div class="detail-row">
                    <span class="label">Status:</span>
                    <span class="value" style="color: #10b981; font-weight: 600;">✓ Confirmado</span>
                  </div>
                </div>
                
                <div style="text-align: center;">
                  <a href="${process.env.APP_URL || '#'}" class="btn">Acessar Portal de Agendamentos</a>
                </div>
              </div>
              <div class="footer">
                <p>Este é um e-mail automático enviado pelo Portal de Agendamentos GR Plano de Ação.</p>
                <p>&copy; ${new Date().getFullYear()} GR Plano de Ação. Todos os direitos reservados.</p>
              </div>
            </div>
          </body>
          </html>
        `,
      };

      await transporter.sendMail(mailOptions);
      console.log(`[Email Service] E-mail enviado com sucesso via SMTP para ${emailTo}!`);
    } catch (serverMailErr) {
      console.error("[Email Service] Erro crítico ao disparar e-mail via SMTP:", serverMailErr);
    }
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
      
      // Dispara o e-mail de confirmação em segundo plano (sem bloquear o tempo de resposta da API)
      sendEmailNotification(newSchedule).catch(err => {
        console.error("Erro assíncrono no envio de e-mail:", err);
      });

      res.status(201).json(newSchedule);
    } catch (e) {
      console.error("Erro na API POST /api/schedules:", e);
      res.status(500).json({ error: e instanceof Error ? e.message : String(e) });
    }
  });

  app.post("/api/test-email", async (req, res) => {
    try {
      const emailTo = process.env.EMAIL_NOTIFY_TO || "joao.giaretta@az-armaturen.com.br";
      const host = process.env.SMTP_HOST;
      const port = process.env.SMTP_PORT;
      const user = process.env.SMTP_USER;
      const pass = process.env.SMTP_PASS;

      if (!host || !user || !pass) {
        return res.json({
          success: false,
          mode: "simulator",
          message: "O SMTP não foi configurado nas variáveis de ambiente. Por isso o portal está usando o Simulador de E-mail (mensagens impressas apenas nos logs do console).",
          details: {
            emailTo,
            smtp_configured: false
          }
        });
      }

      const transporter = nodemailer.createTransport({
        host: host,
        port: Number(port) || 587,
        secure: process.env.SMTP_SECURE === "true",
        auth: {
          user,
          pass,
        },
      });

      const mailOptions = {
        from: `"Portal GR" <${user}>`,
        to: emailTo,
        subject: "🔔 Teste de Conexão: Alertas GR Plano de Ação",
        html: `
          <div style="font-family: inherit; background-color: #f8fafc; padding: 24px; border-radius: 12px; border: 1px solid #e2e8f0; max-width: 500px; margin: auto;">
            <h2 style="color: #2563eb; margin-top: 0;">Conexão SMTP Funcionando!</h2>
            <p>Parabéns, João! Suas credenciais de e-mail foram validadas com sucesso.</p>
            <p>A partir de agora, toda vez que um vendedor realizar ou agendar uma GR, você receberá instantaneamente um e-mail formatado com todos os detalhes.</p>
            <hr style="border: 0; border-top: 1px solid #cbd5e1; margin: 16px 0;" />
            <p style="font-size: 11px; color: #64748b; margin-bottom: 0;">Portal GR Plano de Ação - Notificador Automático</p>
          </div>
        `
      };

      await transporter.sendMail(mailOptions);
      res.json({
        success: true,
        mode: "smtp",
        message: `Excelente! O e-mail de teste foi enviado com sucesso para ${emailTo} usando o seu servidor SMTP.`
      });
    } catch (err) {
      console.error("Erro no envio do e-mail de teste:", err);
      res.status(500).json({
        success: false,
        error: err instanceof Error ? err.message : String(err),
        message: "Ocorreu um erro real ao se comunicar com o seu servidor SMTP. Verifique o host, usuário, senha, porta ou se o seu provedor de e-mail bloqueou a conexão securitária."
      });
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
