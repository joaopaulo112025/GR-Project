import { useState } from "react";
import { Search, Calendar, User, Folder, Clock, Trash2, Filter, AlertCircle, Mail, HelpCircle, ChevronDown, ChevronUp, Send, CheckCircle2, Loader2, ArrowRight } from "lucide-react";
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
  const [showEmailInfo, setShowEmailInfo] = useState(false);
  const [testStatus, setTestStatus] = useState<"idle" | "loading" | "success" | "error" | "simulator">("idle");
  const [testMessage, setTestMessage] = useState("");

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

  const handleTestEmail = async () => {
    setTestStatus("loading");
    setTestMessage("");

    try {
      const response = await fetch("/api/test-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      
      const contentType = response.headers.get("content-type");
      if (!response.ok || !contentType || !contentType.includes("application/json")) {
        throw new Error("API Offline / Static Build Fallback active");
      }

      const result = await response.json();
      if (result.success) {
        setTestStatus("success");
        setTestMessage(result.message);
      } else {
        if (result.mode === "simulator") {
          setTestStatus("simulator");
        } else {
          setTestStatus("error");
        }
        setTestMessage(result.message || "Simulador ativo.");
      }
    } catch (err) {
      const accessKey = (import.meta as any).env?.VITE_WEB3FORMS_ACCESS_KEY;
      if (!accessKey) {
        setTestStatus("error");
        setTestMessage(
          "O servidor backend SMTP não respondeu e você não configurou a variável 'VITE_WEB3FORMS_ACCESS_KEY' no painel da Vercel. Por ser uma plataforma estática, para receber e-mails de notificação na Vercel você precisa registrar seu e-mail gratuitamente no site https://web3forms.com e cadastrar a chave de acesso gerada como VITE_WEB3FORMS_ACCESS_KEY nas variáveis de ambiente do seu projeto Vercel."
        );
        return;
      }

      try {
        const payload = {
          access_key: accessKey,
          from_name: "Portal GR Teste",
          to_email: "joao.giaretta@az-armaturen.com.br",
          subject: "🔔 Teste de Conexão Frontend - Portal GR Plano de Ação",
          message: `Olá João,\n\nEste é um e-mail de teste de conexão frontend disparado de forma segura a partir do seu portal hospedado na Vercel!`
        };
        const res = await fetch("https://api.web3forms.com/submit", {
          method: "POST",
          headers: { "Content-Type": "application/json", "Accept": "application/json" },
          body: JSON.stringify(payload)
        });
        const result = await res.json();
        if (result.success) {
          setTestStatus("success");
          setTestMessage("Excelente! O e-mail de teste foi enviado diretamente da Vercel via Web3Forms para joao.giaretta@az-armaturen.com.br.");
        } else {
          setTestStatus("error");
          setTestMessage("Erro ao submeter ao Web3Forms: " + (result.message || JSON.stringify(result)));
        }
      } catch (clientErr) {
        setTestStatus("error");
        setTestMessage("Falha ao comunicar com o servidor de e-mail local ou com a API do Web3Forms.");
      }
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
          <p className="text-xs text-slate-500 mb-2">Consulte e gerencie os horários agendados</p>
          <div className="flex flex-wrap gap-2 items-center">
            <button
              onClick={() => setShowEmailInfo(!showEmailInfo)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 hover:bg-blue-100/85 border border-blue-100 rounded-full text-[11px] text-blue-700 font-medium transition-all hover:cursor-pointer"
            >
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-blue-600"></span>
              </span>
              <Mail className="w-3 h-3 text-blue-600" />
              <span>Notificações para:</span>
              <strong className="font-semibold text-blue-800">joao.giaretta@az-armaturen.com.br</strong>
              {showEmailInfo ? <ChevronUp className="w-3 h-3 text-blue-600 ml-0.5" /> : <ChevronDown className="w-3 h-3 text-blue-600 ml-0.5" />}
            </button>
          </div>
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

      {/* Collapsible Email Diagnosis Card */}
      <AnimatePresence>
        {showEmailInfo && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden mb-5 font-sans"
          >
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 text-slate-600 space-y-4">
              <div className="flex items-start gap-2.5">
                <HelpCircle className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="font-bold text-slate-800 text-sm">Problemas em receber e-mails de notificação?</h4>
                  <p className="text-xs leading-relaxed text-slate-500">
                    O portal foi desenhado com dois caminhos inteligentes de alertas para garantir o envio a depender de onde você estiver hospedado. Veja como configurar cada um deles:
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2 pt-3 border-t border-slate-200 text-xs">
                <div className="space-y-2 bg-white/60 p-3 rounded-xl border border-slate-100">
                  <h5 className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
                    <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                    1. No Compartilhamento do AI Studio (Cloud Run)
                  </h5>
                  <p className="leading-relaxed text-slate-500 text-[11px]">
                    Para que o servidor Node.js envie e-mails via SMTP, você precisa configurar as credenciais no menu <strong>Configurações (Settings) &gt; Secrets</strong> do AI Studio. Caso contrário, ele rodará em modo <strong>Simulador</strong> apenas imprimindo os e-mails nos logs de console da IDE.
                  </p>
                  <p className="text-[11px] font-semibold text-slate-600">Insira nos Secrets do AI Studio:</p>
                  <ul className="space-y-1 text-slate-500 font-mono text-[10px] pl-1">
                    <li>• <b className="text-slate-700">SMTP_HOST</b> (ex: smtp.gmail.com)</li>
                    <li>• <b className="text-slate-700">SMTP_PORT</b> (ex: 587)</li>
                    <li>• <b className="text-slate-700">SMTP_USER</b> (seu e-mail comercial)</li>
                    <li>• <b className="text-slate-700">SMTP_PASS</b> (senha de aplicativo gerada no provedor)</li>
                  </ul>
                </div>

                <div className="space-y-2 bg-white/60 p-3 rounded-xl border border-slate-100">
                  <h5 className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
                    <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                    2. No Servidor de Produção (Vercel)
                  </h5>
                  <p className="leading-relaxed text-slate-500 text-[11px]">
                    A Vercel é estática por natureza. Quando a API do Express está inacessível, o navegador assume o fluxo de persistência com o Firestore e faz disparos de e-mails usando a segura API gratuita <strong>Web3Forms</strong>.
                  </p>
                  <p className="text-[11px] font-semibold text-slate-600">Para ativar os e-mails no Vercel:</p>
                  <ol className="space-y-1 text-slate-500 text-[11px] list-decimal pl-4">
                    <li>Insira seu e-mail em <a href="https://web3forms.com" target="_blank" rel="noreferrer" className="text-blue-600 font-semibold underline hover:text-blue-800">web3forms.com</a> para receber a chave gratuita.</li>
                    <li>No painel da Vercel, crie a variável de ambiente: 👉 <strong className="font-mono text-[10px] bg-slate-100 px-1 py-0.5 border border-slate-200 rounded">VITE_WEB3FORMS_ACCESS_KEY</strong> com o token recebido.</li>
                  </ol>
                </div>
              </div>

              {/* Action Button */}
              <div className="bg-blue-50/50 border border-blue-100/75 p-3.5 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                <div>
                  <h6 className="font-semibold text-blue-900 text-xs flex items-center gap-1">
                    <Send className="w-3.5 h-3.5 text-blue-600 animate-pulse" />
                    Enviar e-mail para verificar conexão
                  </h6>
                  <p className="text-blue-700/80 text-[10px] sm:max-w-md mt-0.5">
                    Disparar um e-mail teste agora para <strong className="font-semibold">joao.giaretta@az-armaturen.com.br</strong> para mapear se os dados estão corretos no servidor atual.
                  </p>
                </div>
                <div>
                  <button
                    type="button"
                    onClick={handleTestEmail}
                    disabled={testStatus === "loading"}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold hover:cursor-pointer transition-all disabled:opacity-50 shadow-sm shadow-blue-500/15"
                  >
                    {testStatus === "loading" ? (
                      <>
                        <Loader2 className="w-3 h-3 animate-spin" />
                        <span>Enviando...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-3 h-3" />
                        <span>Disparar Teste</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Status Alert Message */}
              {testStatus !== "idle" && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-3.5 rounded-xl border text-xs leading-relaxed flex gap-2.5 ${
                    testStatus === "success"
                      ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                      : testStatus === "simulator"
                      ? "bg-amber-50 border-amber-200 text-amber-800"
                      : testStatus === "loading"
                      ? "bg-slate-100 border-slate-200 text-slate-600 animate-pulse"
                      : "bg-rose-50 border-rose-250 text-rose-800"
                  }`}
                >
                  <AlertCircle className={`w-4 h-4 shrink-0 mt-0.5 ${
                    testStatus === "success" ? "text-emerald-600" : testStatus === "simulator" ? "text-amber-600" : testStatus === "loading" ? "text-slate-400" : "text-rose-600"
                  }`} />
                  <div>
                    <strong className="font-bold block mb-0.5 text-xs uppercase tracking-wider">
                      {testStatus === "success" && "✓ Envio SMTP / Web3Forms Conectado!"}
                      {testStatus === "simulator" && "⚠ Modo de Simulação Ativo (Logs no Console)"}
                      {testStatus === "error" && "✗ Erro Técnico Detectado"}
                      {testStatus === "loading" && "Validando credenciais de envio..."}
                    </strong>
                    <p className="text-[11px] leading-relaxed mt-0.5">{testMessage}</p>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
