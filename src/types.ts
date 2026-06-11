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
    return { blocked: true, reason: "Bloqueado (≥ 17:00 às 08:00)" };
  }
  return { blocked: false, reason: "" };
}
