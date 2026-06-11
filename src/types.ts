export interface GRSchedule {
  id: string;
  vendedor: string;
  projeto: string;
  data: string;
  horario: string;
  createdAt: string;
}

export type TimeSlot =
  | "07:00"
  | "08:00"
  | "09:00"
  | "10:00"
  | "11:00"
  | "12:00"
  | "13:30"
  | "14:30"
  | "15:30"
  | "16:30"
  | "17:00";

export const TIME_SLOT_LABELS: Record<TimeSlot, string> = {
  "07:00": "07:00 - 08:00",
  "08:00": "08:00 - 09:00",
  "09:00": "09:00 - 10:00",
  "10:00": "10:00 - 11:00",
  "11:00": "11:00 - 12:00",
  "12:00": "12:00 - 13:30",
  "13:30": "13:30 - 14:30",
  "14:30": "14:30 - 15:30",
  "15:30": "15:30 - 16:30",
  "16:30": "16:30 - 17:00",
  "17:00": "17:00 - 18:00",
};

export function isSystemBlockedSlot(slot: TimeSlot): { blocked: boolean; reason: string } {
  if (slot === "07:00") {
    return { blocked: true, reason: "Bloqueado (07:00 - 08:00)" };
  }
  if (slot === "12:00") {
    return { blocked: true, reason: "Bloqueado (Almoço 12:00 - 13:30)" };
  }
  if (slot === "17:00") {
    return { blocked: true, reason: "Bloqueado (Espanha / Fora de Horário)" };
  }
  return { blocked: false, reason: "" };
}

export function isSystemBlockedDate(dateStr: string): { blocked: boolean; reason: string } {
  if (!dateStr) return { blocked: false, reason: "" };

  if (dateStr === "2026-06-11") {
    return { blocked: true, reason: "Bloqueado (Data Reservada/Feriado - 11/06/2026)" };
  }
  if (dateStr === "2026-06-12") {
    return { blocked: true, reason: "Bloqueado (Data Reservada/Feriado - 12/06/2026)" };
  }

  try {
    const parts = dateStr.split("-");
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const dateObj = new Date(year, month, day);
      const dayOfWeek = dateObj.getDay(); // 0 = Sunday, 6 = Saturday
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        return { blocked: true, reason: `Bloqueado (Fim de semana: ${dayOfWeek === 0 ? "Domingo" : "Sábado"})` };
      }
    }
  } catch (e) {
    // Ignore error
  }

  return { blocked: false, reason: "" };
}

