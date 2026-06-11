import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Calendar, Clock, ShieldCheck, CheckCircle2 } from "lucide-react";
import { GRSchedule, getLocalDateString } from "./types";
import ScheduleForm from "./components/ScheduleForm";
import ScheduleList from "./components/ScheduleList";
import CalendarWideView from "./components/CalendarWideView";

// Direct client-side Firebase initialization fallback for static deployments (like Vercel)
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, setDoc, deleteDoc } from "firebase/firestore";
import firebaseConfig from "../firebase-applet-config.json";

const clientApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const clientDb = getFirestore(clientApp, firebaseConfig.firestoreDatabaseId);

export default function App() {
  const [schedules, setSchedules] = useState<GRSchedule[]>([]);
  const [activeTab, setActiveTab] = useState<"booking" | "calendar">("booking");
  const [preselectedDate, setPreselectedDate] = useState<string>("");

  // Fetch schedules from backend database with 3-second polling for real-time synchronization
  useEffect(() => {
    let active = true;

    const loadData = async () => {
      try {
        const res = await fetch("/api/schedules");
        if (!res.ok) throw new Error("Status " + res.status);
        const data = await res.json();
        if (active) {
          setSchedules(data || []);
        }
      } catch (err) {
        console.warn("Express backend API offline ou indisponível. Buscando diretamente do Firestore no cliente:", err);
        try {
          const qSnapshot = await getDocs(collection(clientDb, "schedules"));
          const list: GRSchedule[] = [];
          qSnapshot.forEach((docRef) => {
            list.push({ id: docRef.id, ...docRef.data() } as GRSchedule);
          });
          if (active) {
            setSchedules(list);
          }
        } catch (fsErr) {
          console.error("Erro ao ler do Firestore direto no cliente:", fsErr);
        }
      }
    };

    loadData();
    const interval = setInterval(loadData, 3000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  const handleAddSchedule = async (newData: { vendedor: string; projeto: string; data: string; horario: string }) => {
    const newSchedule: GRSchedule = {
      id: `gr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      vendedor: newData.vendedor,
      projeto: newData.projeto,
      data: newData.data,
      horario: newData.horario,
      createdAt: new Date().toISOString(),
    };

    try {
      const res = await fetch("/api/schedules", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newSchedule),
      });
      if (!res.ok) throw new Error("Backend post error status: " + res.status);
      const saved = await res.json();
      setSchedules((prev) => [saved, ...prev]);
    } catch (err) {
      console.warn("Falha ao salvar no Express. Enviando agendamento direto para o Firestore no cliente...", err);
      try {
        await setDoc(doc(clientDb, "schedules", newSchedule.id), newSchedule);
        setSchedules((prev) => [newSchedule, ...prev]);
      } catch (fsErr) {
        console.error("Erro ao salvar no Firestore direto no cliente:", fsErr);
      }
    }
  };

  const handleDeleteSchedule = async (id: string) => {
    try {
      const res = await fetch(`/api/schedules/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Backend delete error status: " + res.status);
      setSchedules((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      console.warn("Falha ao excluir no Express. Removendo agendamento direto no Firestore do cliente...", err);
      try {
        await deleteDoc(doc(clientDb, "schedules", id));
        setSchedules((prev) => prev.filter((item) => item.id !== id));
      } catch (fsErr) {
        console.error("Erro ao excluir do Firestore direto no cliente:", fsErr);
      }
    }
  };

  // Compute neat KPI statistics
  const todayStr = getLocalDateString();
  const schedulesToday = schedules.filter(s => s.data === todayStr).length;
  const totalSchedules = schedules.length;

  return (
    <div
      id="app-root-container"
      className="min-h-screen bg-slate-50/70 py-8 px-4 sm:px-6 lg:px-8 font-sans flex flex-col justify-between"
    >
      <div className="max-w-6xl mx-auto w-full flex-1">
        
        {/* Top Header Section */}
        <header id="app-header" className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-100 pb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-md shadow-blue-500/10">
              <Calendar className="w-6 h-6" id="header-calendar-icon" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-blue-600 tracking-wider uppercase font-display block">
                Comercial & Planejamento
              </span>
              <h1 id="app-title" className="text-2xl font-display font-bold text-slate-800 tracking-tight">
                Gestão de resultados de projetos
              </h1>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="flex gap-3 text-xs" id="header-metrics">
            <div className="bg-white px-4 py-2.5 rounded-xl border border-slate-100 shadow-3xs flex items-center gap-2.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-slate-500">Agendamentos hoje:</span>
              <strong className="text-slate-800 font-semibold">{schedulesToday}</strong>
            </div>
            <div className="bg-white px-4 py-2.5 rounded-xl border border-slate-100 shadow-3xs flex items-center gap-2.5">
              <ShieldCheck className="w-4 h-4 text-blue-500" />
              <span className="text-slate-500">Total agendado:</span>
              <strong className="text-slate-800 font-semibold">{totalSchedules}</strong>
            </div>
          </div>
        </header>

        {/* Informative Help Alert */}
        <div id="info-alert" className="mb-6 p-4 bg-blue-50/50 border border-blue-100 rounded-2xl flex gap-3 text-sm text-slate-600">
          <CheckCircle2 className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
          <p>
            <b>Como funciona?</b> Selecione a data desejada e verifique quais horários de 45 minutos estão livres.
            Os horários reservados por outros corretores ou vendedores serão bloqueados para evitar conflitos de agenda <b>(sem dupla reserva)</b>.
            Todas as reuniões do portal são voltadas exclusivamente para o projeto <b>GR Plano de ação</b>.
          </p>
        </div>

        {/* Elegant Navigation Tabs */}
        <div className="flex border-b border-slate-200 mb-6 gap-2" id="app-tabs-navigator">
          <button
            type="button"
            id="tab-booking-trigger"
            onClick={() => setActiveTab("booking")}
            className={`flex items-center gap-2 px-5 py-3 border-b-2 font-display text-sm font-semibold transition-all hover:cursor-pointer ${
              activeTab === "booking"
                ? "border-blue-600 text-blue-600 bg-blue-50/20"
                : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"
            }`}
          >
            <Clock className="w-4 h-4" />
            Novo Agendamento & Fila
          </button>
          <button
            type="button"
            id="tab-calendar-trigger"
            onClick={() => setActiveTab("calendar")}
            className={`flex items-center gap-2 px-5 py-3 border-b-2 font-display text-sm font-semibold transition-all hover:cursor-pointer ${
              activeTab === "calendar"
                ? "border-blue-600 text-blue-600 bg-blue-50/20"
                : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"
            }`}
          >
            <Calendar className="w-4 h-4" />
            Visão Ampla do Calendário
          </button>
        </div>

        {activeTab === "booking" ? (
          /* Dashboard Workstation Grid */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start" id="dashboard-grid">
            
            {/* Left Column: Booking Form */}
            <section className="lg:col-span-5" id="form-column">
              <ScheduleForm
                onAddSchedule={handleAddSchedule}
                existingSchedules={schedules}
                preselectedDate={preselectedDate}
              />
            </section>

            {/* Right Column: Bookings Status & List */}
            <section className="lg:col-span-7 h-full" id="list-column">
              <ScheduleList
                schedules={schedules}
                onDeleteSchedule={handleDeleteSchedule}
              />
            </section>
          </div>
        ) : (
          <CalendarWideView
            schedules={schedules}
            onSelectDate={(dateStr) => {
              setPreselectedDate(dateStr);
              setActiveTab("booking");
            }}
          />
        )}

      </div>

      {/* Elegant Bottom Footer */}
      <footer id="app-footer" className="mt-12 text-center text-xs text-slate-400 border-t border-slate-100 pt-6 max-w-6xl mx-auto w-full">
        <p>© 2026 Portal Comercial - Gestão de resultados de projetos</p>
        <p className="mt-1 text-slate-400/80">
          Desenvolvido com foco no alinhamento de entregas e KPIs de projetos de tecnologia.
        </p>
      </footer>
    </div>
  );
}
