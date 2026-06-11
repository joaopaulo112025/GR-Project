import React, { useState } from "react";
import { ChevronLeft, ChevronRight, Calendar, Clock, User, CheckCircle, Lightbulb, Sparkles, AlertCircle } from "lucide-react";
import { GRSchedule, TIME_SLOT_LABELS, TimeSlot, isSystemBlockedDate } from "../types";

interface CalendarWideViewProps {
  schedules: GRSchedule[];
  onSelectDate: (dateStr: string) => void;
}

export default function CalendarWideView({ schedules, onSelectDate }: CalendarWideViewProps) {
  // We can track the current viewed month. Let's initialize to the current date or June 2026.
  const [currentDate, setCurrentDate] = useState(() => {
    // Default to June 2026 or current system date if we are in 2026/after
    const today = new Date();
    return today;
  });

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-indexed

  // Portuguese months
  const MONTH_NAMES = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];

  const WEEK_DAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

  // Helper to get days in month
  const getDaysInMonth = (y: number, m: number) => {
    return new Date(y, m + 1, 0).getDate();
  };

  // Helper to get first day of month (0 = Sunday, 1 = Monday ...)
  const getFirstDayOfMonth = (y: number, m: number) => {
    return new Date(y, m, 1).getDay();
  };

  const daysCount = getDaysInMonth(year, month);
  const firstDayIndex = getFirstDayOfMonth(year, month);

  // Generate date cells array
  const cells: (Date | null)[] = [];
  // Empty slots for alignment
  for (let i = 0; i < firstDayIndex; i++) {
    cells.push(null);
  }
  // Days of the month
  for (let d = 1; d <= daysCount; d++) {
    cells.push(new Date(year, month, d));
  }

  // Format date helper matching YYYY-MM-DD
  const formatDateISO = (date: Date) => {
    const yStr = date.getFullYear();
    const mStr = String(date.getMonth() + 1).padStart(2, "0");
    const dStr = String(date.getDate()).padStart(2, "0");
    return `${yStr}-${mStr}-${dStr}`;
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const todayStr = new Date().toISOString().split("T")[0];

  return (
    <div id="calendar-wide-view-card" className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 md:p-8 flex flex-col gap-6">
      
      {/* Decorative Broad Calendar Banner */}
      <div id="calendar-wide-hero-banner" className="grid grid-cols-1 md:grid-cols-12 items-center gap-6 bg-gradient-to-r from-blue-600 via-sky-600 to-indigo-600 rounded-2xl p-6 text-white overflow-hidden relative shadow-sm">
        
        {/* Floating background decorative vectors */}
        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-white/5 rounded-full blur-2xl pointer-events-none"></div>
        <div className="absolute left-1/3 -top-12 w-32 h-32 bg-sky-400/10 rounded-full blur-xl pointer-events-none"></div>

        <div className="md:col-span-8 space-y-2 relative z-10">
          <div className="inline-flex items-center gap-1.5 bg-white/10 backdrop-blur-md px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wider uppercase">
            <Sparkles className="w-3 h-3 text-sky-200" />
            Visão Geral de Disponibilidade
          </div>
          <h3 className="text-xl md:text-2xl font-display font-bold leading-tight">
            Calendário - Gestão de resultados de projetos
          </h3>
          <p className="text-sm text-sky-100 max-w-lg leading-relaxed">
            Nesta aba, visualize o mapa mensal completo de reuniões do projeto <b>GR Plano de ação</b>. 
            Clique em qualquer dia livre para selecioná-lo rapidamente no formulário de reserva sem conflitos.
          </p>
        </div>

        {/* Beautiful vector graphics representing a calendar broad view */}
        <div className="hidden md:flex md:col-span-4 justify-center relative z-10" id="calendar-vector-illustration">
          <svg className="w-32 h-32 drop-shadow-xl" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Calendar back card */}
            <rect x="25" y="35" width="150" height="135" rx="18" fill="white" />
            
            {/* Red/Blue header bar */}
            <path d="M25 53C25 43.0589 33.0589 35 43 35H157C166.941 35 175 43.0589 175 53V65H25V53Z" fill="#3B82F6" />
            
            {/* Binder rings */}
            <rect x="60" y="22" width="12" height="20" rx="6" fill="#D1D5DB" />
            <rect x="128" y="22" width="12" height="20" rx="6" fill="#D1D5DB" />
            <circle cx="66" cy="32" r="3" fill="#9CA3AF" />
            <circle cx="134" cy="32" r="3" fill="#9CA3AF" />

            {/* Checkmark circle */}
            <circle cx="140" cy="125" r="28" fill="#10B981" />
            <path d="M128 125L136 133L152 117" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />

            {/* Grid placeholders */}
            <rect x="45" y="85" width="18" height="14" rx="3" fill="#EFF6FF" />
            <rect x="73" y="85" width="18" height="14" rx="3" fill="#EFF6FF" />
            <rect x="101" y="85" width="18" height="14" rx="3" fill="#EFF6FF" />
            <rect x="129" y="85" width="18" height="14" rx="3" fill="#EFF6FF" />
            
            <rect x="45" y="108" width="18" height="14" rx="3" fill="#EFF6FF" />
            <rect x="73" y="108" width="18" height="14" rx="3" fill="#3B82F6" />
            <rect x="101" y="108" width="18" height="14" rx="3" fill="#EFF6FF" />
            
            <rect x="45" y="131" width="18" height="14" rx="3" fill="#EFF6FF" />
            <rect x="73" y="131" width="18" height="14" rx="3" fill="#EFF6FF" />
            <rect x="101" y="131" width="18" height="14" rx="3" fill="#EFF6FF" />
          </svg>
        </div>
      </div>

      {/* Month Navigator Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-4" id="calendar-month-selector">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-blue-600" />
          <span className="text-lg font-display font-bold text-slate-800">
            {MONTH_NAMES[month]} {year}
          </span>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg">
          <button
            type="button"
            id="prev-month-btn"
            onClick={handlePrevMonth}
            className="p-1.5 hover:bg-white text-slate-600 rounded-md transition-all active:scale-95"
            title="Mês Anterior"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            id="today-month-btn"
            onClick={() => setCurrentDate(new Date())}
            className="px-2.5 py-1 text-xs font-semibold hover:bg-white text-blue-600 rounded-md transition-all active:scale-95"
          >
            Mês Atual
          </button>
          <button
            type="button"
            id="next-month-btn"
            onClick={handleNextMonth}
            className="p-1.5 hover:bg-white text-slate-600 rounded-md transition-all active:scale-95"
            title="Próximo Mês"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Grid of the monthly calendar */}
      <div className="border border-slate-150 rounded-xl overflow-hidden shadow-2xs" id="monthly-grid-wrapper">
        {/* Days of week header */}
        <div className="grid grid-cols-7 bg-slate-50 border-b border-slate-150 text-center py-2.5 text-xs font-semibold text-slate-600" id="weekday-names">
          {WEEK_DAYS.map((day) => (
            <div key={day}>{day}</div>
          ))}
        </div>

        {/* Days cells */}
        <div className="grid grid-cols-7 bg-slate-100/30 gap-[1px] min-h-[350px]" id="calendar-day-cells">
          {cells.map((cell, idx) => {
            if (!cell) {
              return (
                <div
                  key={`empty-${idx}`}
                  className="bg-slate-50/50 p-2 min-h-[70px] sm:min-h-[90px]"
                ></div>
              );
            }

            const cellISO = formatDateISO(cell);
            const isToday = cellISO === todayStr;
            const blockInfo = isSystemBlockedDate(cellISO);
            const isBlocked = blockInfo.blocked;

            // Find all schedules booked for this day
            const cellSchedules = schedules.filter((s) => s.data === cellISO);
            const totalBookedCount = cellSchedules.length;

            return (
              <div
                key={cellISO}
                onClick={() => {
                  onSelectDate(cellISO);
                }}
                className={`bg-white p-2 min-h-[70px] sm:min-h-[105px] border-t border-slate-100 transition-all cursor-pointer flex flex-col justify-between group ${
                  isBlocked
                    ? "bg-red-50/15 hover:bg-red-50/30 border-red-100"
                    : isToday
                    ? "bg-blue-50/25 ring-2 ring-blue-500/10"
                    : "hover:bg-slate-50/80"
                }`}
              >
                {/* Cell Header: Day number */}
                <div className="flex justify-between items-center mb-1">
                  <span
                    className={`text-xs font-bold leading-none w-6 h-6 flex items-center justify-center rounded-full ${
                      isBlocked
                        ? "bg-red-100 text-red-700 line-through"
                        : isToday
                        ? "bg-blue-600 text-white shadow-xs"
                        : "text-slate-700 group-hover:text-blue-600"
                    }`}
                  >
                    {cell.getDate()}
                  </span>

                  {isBlocked ? (
                    <span 
                      className="text-[9px] font-bold px-1.5 py-0.5 bg-red-100 text-red-700 rounded-full flex items-center gap-1 shrink-0"
                      title={blockInfo.reason}
                    >
                      <AlertCircle className="w-2.5 h-2.5" />
                      Bloqueado
                    </span>
                  ) : totalBookedCount > 0 ? (
                    <span 
                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                        totalBookedCount >= 4 
                          ? "bg-rose-100 text-rose-700" 
                          : "bg-emerald-100 text-emerald-800"
                      }`}
                      title={`${totalBookedCount} agendados`}
                    >
                      {totalBookedCount} {totalBookedCount === 1 ? "reunião" : "reuniões"}
                    </span>
                  ) : null}
                </div>

                {/* Scheduled Slots Container */}
                <div className="flex-1 space-y-1 overflow-y-auto max-h-[60px] scrollbar-thin">
                  {isBlocked ? (
                    <div className="text-[10px] text-red-650 font-medium px-1 flex flex-col justify-center leading-tight py-1 font-sans">
                      <span className="font-semibold opacity-90 truncate text-red-600" title="Bloqueado">
                        Bloqueado
                      </span>
                    </div>
                  ) : (
                    cellSchedules.map((schedule) => (
                      <div
                        key={schedule.id}
                        className="text-[10px] bg-slate-100 hover:bg-sky-50 text-slate-700 p-0.5 px-1.5 rounded-md truncate font-sans flex items-center gap-1 border border-slate-200/50"
                        title={`${schedule.horario} - Vendedor: ${schedule.vendedor}`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0"></span>
                        <strong className="text-slate-800 font-semibold">{schedule.horario}</strong>
                        <span className="truncate opacity-90">- {schedule.vendedor}</span>
                      </div>
                    ))
                  )}
                  
                  {totalBookedCount === 0 && !isBlocked && (
                    <div className="hidden group-hover:flex items-center justify-center h-full text-[10px] text-blue-500 font-medium">
                      + Agendar
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Helpful legend banner */}
      <div id="calendar-legends" className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 rounded-xl p-4 border border-slate-100 text-xs text-slate-600">
        <div className="flex items-start gap-2">
          <Lightbulb className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <p>
            <b>Dupla reserva bloqueada:</b> O sistema impedirá automaticamente que qualquer pessoa agende para o mesmo dia e horário que já estejam ocupados.
          </p>
        </div>
        <div className="flex items-start gap-2">
          <CheckCircle className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
          <p>
            <b>Agendamento Rápido:</b> Ao clicar em um dia acima, você muda a data no formulário da aba inicial e pode preencher seu nome num piscar de olhos.
          </p>
        </div>
      </div>

    </div>
  );
}
