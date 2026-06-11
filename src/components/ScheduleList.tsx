import { useState } from "react";
import { Search, Calendar, User, Folder, Clock, Trash2, Filter, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { GRSchedule, TIME_SLOT_LABELS, TimeSlot, getLocalDateString } from "../types";

interface ScheduleListProps {
  schedules: GRSchedule[];
  onDeleteSchedule: (id: string) => void;
}

export default function ScheduleList({ schedules, onDeleteSchedule }: ScheduleListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<"todos" | "hoje" | "proximos">("todos");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Parse schedules with filters
  const todayStr = getLocalDateString();

  const filteredSchedules = schedules.filter(item => {
    // Search query matches
    const sellerMatch = item.vendedor.toLowerCase().includes(searchQuery.toLowerCase());
    const projectMatch = item.projeto.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSearch = sellerMatch || projectMatch;

    if (!matchesSearch) return false;

    // Direct filter matches
    if (activeFilter === "hoje") {
      return item.data === todayStr;
    } else if (activeFilter === "proximos") {
      return item.data >= todayStr;
    }
    return true; // "todos"
  });

  // Sort: earlier dates first
  const sortedSchedules = [...filteredSchedules].sort((a, b) => {
    if (a.data !== b.data) {
      return a.data.localeCompare(b.data);
    }
    return a.horario.localeCompare(b.horario);
  });

  // Convert date format from YYYY-MM-DD to DD/MM/YYYY
  const formatDate = (dateStr: string) => {
    try {
      const parts = dateStr.split("-");
      if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
      return dateStr;
    } catch {
      return dateStr;
    }
  };

  return (
    <div id="schedule-list-container" className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 md:p-8 flex flex-col h-full">
      {/* Header and Search */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h2 id="list-heading" className="text-xl font-display font-semibold text-slate-800">
            Fila de Agendamentos
          </h2>
          <p className="text-xs text-slate-500">Consulte e gerencie os horários agendados</p>
        </div>

        {/* Filter Badges */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg self-start">
          <button
            type="button"
            id="filter-todos-btn"
            onClick={() => setActiveFilter("todos")}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
              activeFilter === "todos"
                ? "bg-white text-slate-800 shadow-xs"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Todos
          </button>
          <button
            type="button"
            id="filter-hoje-btn"
            onClick={() => setActiveFilter("hoje")}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
              activeFilter === "hoje"
                ? "bg-white text-slate-800 shadow-xs"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Hoje
          </button>
          <button
            type="button"
            id="filter-proximos-btn"
            onClick={() => setActiveFilter("proximos")}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
              activeFilter === "proximos"
                ? "bg-white text-slate-800 shadow-xs"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Próximos
          </button>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative mb-5" id="search-container">
        <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400 pointer-events-none">
          <Search className="w-4 h-4" />
        </span>
        <input
          type="text"
          id="search-input"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Buscar por vendedor ou projeto..."
          className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-500 transition-all text-sm"
        />
      </div>

      {/* Slots Available Counter & Quick Status */}
      <div className="flex justify-between items-center bg-slate-50/50 rounded-xl p-3 border border-slate-100 text-xs text-slate-600 mb-4" id="stats-banner">
        <span>Filtro ativo: <b className="text-slate-800 capitalize">{activeFilter}</b></span>
        <span>Aparecendo: <b className="text-slate-800">{sortedSchedules.length}</b> de <b className="text-slate-800">{schedules.length}</b></span>
      </div>

      {/* Cards List Wrapper */}
      <div className="flex-1 overflow-y-auto max-h-[460px] pr-1 space-y-3" id="cards-wrapper">
        <AnimatePresence mode="popLayout">
          {sortedSchedules.length > 0 ? (
            sortedSchedules.map((schedule) => {
              const isDeleting = deletingId === schedule.id;

              return (
                <motion.div
                  key={schedule.id}
                  id={`schedule-card-${schedule.id}`}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -10 }}
                  layout
                  className={`p-4 rounded-xl border transition-all ${
                    isDeleting
                      ? "bg-rose-50/50 border-rose-200"
                      : "bg-white border-slate-150 shadow-xs hover:shadow-xs hover:border-slate-300"
                  }`}
                >
                  <div className="flex gap-3 justify-between items-start">
                    <div className="space-y-2">
                      {/* Project title */}
                      <div className="flex items-center gap-1.5 font-medium text-slate-800">
                        <Folder className="w-4 h-4 text-sky-500 shrink-0" />
                        <span className="font-semibold text-sm line-clamp-1">{schedule.projeto}</span>
                      </div>

                      {/* Seller Name */}
                      <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>Vendedor: <b className="text-slate-700 font-medium">{schedule.vendedor}</b></span>
                      </div>

                      {/* Date & Time pills */}
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 text-[10px] font-semibold px-2 py-1 rounded-md">
                          <Calendar className="w-3 h-3 text-slate-500" />
                          {formatDate(schedule.data)}
                        </span>
                        <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 text-[10px] font-semibold px-2 py-1 rounded-md">
                          <Clock className="w-3 h-3 text-blue-500" />
                          {TIME_SLOT_LABELS[schedule.horario as TimeSlot]}
                        </span>
                        {schedule.data === todayStr && (
                          <span className="inline-flex items-center bg-amber-50 text-amber-700 text-[10px] font-semibold px-2 py-1 rounded-md">
                            Hoje
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions panel */}
                    <div className="shrink-0 flex items-center justify-end">
                      {isDeleting ? (
                        <div className="flex flex-col items-end gap-1" id={`confirm-delete-${schedule.id}`}>
                          <span className="text-[10px] text-rose-600 font-medium font-sans">Cancelar?</span>
                          <div className="flex gap-1">
                            <button
                              type="button"
                              id={`confirm-delete-yes-${schedule.id}`}
                              onClick={() => {
                                onDeleteSchedule(schedule.id);
                                setDeletingId(null);
                              }}
                              className="px-2 py-0.5 bg-rose-600 hover:bg-rose-700 text-white rounded-md text-[10px] font-bold hover:cursor-pointer transition-colors"
                            >
                              Sim
                            </button>
                            <button
                              type="button"
                              id={`confirm-delete-no-${schedule.id}`}
                              onClick={() => setDeletingId(null)}
                              className="px-2 py-0.5 bg-slate-200 hover:bg-slate-300 text-slate-600 rounded-md text-[10px] font-bold hover:cursor-pointer transition-colors"
                            >
                              Não
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          type="button"
                          id={`delete-btn-${schedule.id}`}
                          onClick={() => setDeletingId(schedule.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all hover:cursor-pointer"
                          title="Cancelar Agendamento"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })
          ) : (
            <motion.div
              id="empty-schedules-card"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-12 px-4 border border-dashed border-slate-200 rounded-2xl text-center"
            >
              <div className="p-3 bg-slate-50 text-slate-400 rounded-full mb-3">
                <AlertCircle className="w-6 h-6" />
              </div>
              <p className="text-slate-700 font-medium text-sm">Nenhum agendamento encontrado</p>
              <p className="text-slate-400 text-xs max-w-xs mt-1">
                Tente alterar os termos da busca ou agende uma nova GR usando o formulário ao lado.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400" id="footer-notes">
        <span>* Gestão de resultados de projetos</span>
        <span>Código Local Ativo</span>
      </div>
    </div>
  );
}
