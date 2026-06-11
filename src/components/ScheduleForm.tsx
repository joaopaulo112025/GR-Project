import React, { useState, useEffect } from "react";
import { User, Folder, Calendar, Clock, AlertCircle, CheckCircle, Sparkles, Lock } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { GRSchedule, TimeSlot, TIME_SLOT_LABELS, isSystemBlockedSlot, isSystemBlockedDate, getLocalDateString } from "../types";

interface ScheduleFormProps {
  onAddSchedule: (schedule: { vendedor: string; projeto: string; data: string; horario: string }) => void;
  existingSchedules: GRSchedule[];
  preselectedDate?: string;
}

export default function ScheduleForm({ onAddSchedule, existingSchedules, preselectedDate }: ScheduleFormProps) {
  const [vendedor, setVendedor] = useState("");
  const [projeto, setProjeto] = useState("GR Plano de ação");
  const [data, setData] = useState("");
  const [horario, setHorario] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Clean success or error feedback when fields change
  useEffect(() => {
    if (errorMessage && !errorMessage.includes("Bloqueado")) {
      setErrorMessage("");
    }
  }, [vendedor, projeto, data, horario]);

  // Handle immediate error warning when choosing a blocked date
  useEffect(() => {
    if (data) {
      const dateBlock = isSystemBlockedDate(data);
      if (dateBlock.blocked) {
        setErrorMessage(dateBlock.reason);
        setHorario("");
      } else {
        // Clear message if it was a date block message
        setErrorMessage(prev => prev.includes("Bloqueado") ? "" : prev);
      }
    }
  }, [data]);

  // Helper to find booking details for a slot on the selected date
  const getSlotBooking = (slot: string) => {
    if (!data) return null;
    return existingSchedules.find(s => s.data === data && s.horario === slot) || null;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!vendedor.trim()) {
      setErrorMessage("Por favor, preencha o nome do Vendedor.");
      return;
    }
    if (!projeto.trim()) {
      setErrorMessage("Por favor, preencha o nome ou ID do Projeto.");
      return;
    }
    if (!data) {
      setErrorMessage("Por favor, selecione uma data.");
      return;
    }

    const dateBlock = isSystemBlockedDate(data);
    if (dateBlock.blocked) {
      setErrorMessage(dateBlock.reason);
      return;
    }

    if (!horario) {
      setErrorMessage("Por favor, escolha um horário disponível.");
      return;
    }

    // Check for double bookings
    const existing = getSlotBooking(horario);
    if (existing) {
      setErrorMessage(`O horário ${TIME_SLOT_LABELS[horario as TimeSlot]} já está reservado nesta data (por ${existing.vendedor}).`);
      return;
    }

    // Call callback
    onAddSchedule({
      vendedor: vendedor.trim(),
      projeto: "GR Plano de ação",
      data,
      horario,
    });

    // Reset form states
    setVendedor("");
    setHorario("");
    setSuccessMessage("Agendamento efetuado com sucesso!");

    // Auto-dismiss success message
    setTimeout(() => {
      setSuccessMessage("");
    }, 4000);
  };

  // Pre-fill or sync date when preselectedDate changes, or default to today
  useEffect(() => {
    if (preselectedDate) {
      setData(preselectedDate);
    } else if (!data) {
      const today = getLocalDateString();
      setData(today);
    }
  }, [preselectedDate]);

  const timeSlots: TimeSlot[] = [
    "07:00",
    "08:00",
    "09:00",
    "10:00",
    "11:00",
    "12:00",
    "13:30",
    "14:30",
    "15:30",
    "16:30",
    "17:00"
  ];

  return (
    <div id="schedule-form-container" className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 md:p-8">
      <div className="flex items-center gap-2 mb-6">
        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
          <Calendar className="w-5 h-5" id="calendar-icon" />
        </div>
        <div>
          <h2 id="form-heading" className="text-xl font-display font-semibold text-slate-800">
            Reserva - Gestão de Resultados
          </h2>
          <p className="text-xs text-slate-500">
            Agendamento do projeto: Gestão de resultados de projetos
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} id="schedule-main-form" className="space-y-5">
        {/* Alerts block */}
        <AnimatePresence mode="wait">
          {errorMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              id="error-feedback"
              className="p-3 bg-rose-50 border border-rose-100 text-rose-700 text-sm rounded-lg flex items-start gap-2.5"
            >
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{errorMessage}</span>
            </motion.div>
          )}

          {successMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              id="success-feedback"
              className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-700 text-sm rounded-lg flex items-start gap-2.5"
            >
              <CheckCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <div className="flex-1">
                <span className="font-medium">{successMessage}</span>
                <p className="text-xs text-emerald-600/90 mt-0.5">O agendamento foi registrado e salvo com sucesso no portal.</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input Vendedor */}
        <div id="vendedor-input-group">
          <label htmlFor="vendedor-input" className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
            Nome do Vendedor
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400 pointer-events-none">
              <User className="w-4 h-4" />
            </span>
            <input
              type="text"
              id="vendedor-input"
              value={vendedor}
              onChange={(e) => setVendedor(e.target.value)}
              placeholder="Digite seu nome completo"
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-500 transition-all text-sm font-sans"
              required
            />
          </div>
        </div>

        {/* Input Projeto */}
        <div id="projeto-input-group">
          <label htmlFor="projeto-input" className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
            Nome / ID do Projeto
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400 pointer-events-none">
              <Folder className="w-4 h-4 text-blue-500" />
            </span>
            <input
              type="text"
              id="projeto-input"
              value={projeto}
              readOnly
              className="w-full pl-10 pr-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 cursor-not-allowed text-sm font-sans font-semibold border-dashed"
              required
            />
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">Este portal está fixado exclusivamente para o projeto <strong className="text-slate-600">GR Plano de ação</strong>.</span>
        </div>

        {/* Input Data */}
        <div id="data-input-group">
          <label htmlFor="data-input" className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
            Data da GR
          </label>
          <div className="relative">
            <span className={`absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none ${
              data && isSystemBlockedDate(data).blocked ? "text-red-500" : "text-slate-400"
            }`}>
              <Calendar className="w-4 h-4" />
            </span>
            <input
              type="date"
              id="data-input"
              value={data}
              onChange={(e) => setData(e.target.value)}
              className={`w-full pl-10 pr-4 py-2.5 rounded-xl transition-all text-sm font-sans focus:outline-none focus:ring-2 ${
                data && isSystemBlockedDate(data).blocked
                  ? "bg-red-50/55 border-red-300 text-red-900 focus:ring-red-500/20 focus:border-red-500"
                  : "bg-slate-50/50 border-slate-200 text-slate-800 focus:ring-blue-500/25 focus:border-blue-500"
              }`}
              min={getLocalDateString()} // Blocks past dates
              required
            />
          </div>
        </div>

        {/* Horários Interativos */}
        <div id="horarios-section" className="space-y-2">
          <span className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
            Horário Disponível
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2" id="slots-grid">
            {timeSlots.map((slot) => {
              const dateBlock = isSystemBlockedDate(data);
              const isDateBlocked = dateBlock.blocked;
              const booking = getSlotBooking(slot);
              const isOccupied = booking !== null;
              const isSelected = horario === slot;
              const blockInfo = isSystemBlockedSlot(slot);
              const isBlocked = blockInfo.blocked || isDateBlocked;
              const isUnavailable = isBlocked || isOccupied;

              return (
                <button
                  key={slot}
                  id={`slot-${slot}`}
                  type="button"
                  disabled={isUnavailable}
                  onClick={() => setHorario(slot)}
                  className={`flex flex-col justify-center text-left p-3 rounded-xl border transition-all relative min-h-[52px] ${
                    isUnavailable
                      ? "bg-red-50/20 border-red-150 text-red-600 cursor-not-allowed"
                      : isSelected
                      ? "bg-blue-50 shadow-sm border-blue-500 text-blue-800 ring-2 ring-blue-500/10"
                      : "bg-white hover:bg-slate-50 border-slate-200 text-slate-700 active:scale-98"
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-medium text-sm">
                    {isUnavailable ? (
                      <Clock className="w-3.5 h-3.5 text-red-500 shrink-0" />
                    ) : (
                      <Clock className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                    )}
                    <span className={isUnavailable ? "text-red-600 font-semibold" : ""}>
                      {TIME_SLOT_LABELS[slot]}
                    </span>
                  </div>
                  {!isUnavailable && (
                    <span className="text-[10px] mt-1 font-sans font-medium flex items-center gap-1 text-inherit opacity-85">
                      {isSelected ? "Selecionado" : "Livre"}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <button
          type="submit"
          id="confirmar-agendamento-btn"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-xl shadow-sm hover:shadow-md transition-all active:scale-98 flex items-center justify-center gap-2 text-sm mt-4 hover:cursor-pointer"
        >
          <Sparkles className="w-4 h-4" />
          Confirmar Agendamento
        </button>
      </form>
    </div>
  );
}
