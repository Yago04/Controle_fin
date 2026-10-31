'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Calendar as CalendarIcon,
  Wallet,
  CheckSquare,
  Dumbbell,
  Clock,
  Trash2,
  CheckCircle2,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

const MONTH_NAMES = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export function CalendarModuleView() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [selectedDay, setSelectedDay] = useState(now.getDate());
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtros de Camadas
  const [layers, setLayers] = useState({
    FINANCE: true,
    EVENTS: true,
    TASKS: true,
    GYM: true,
    POMODORO: true,
  });

  // Form Novo Evento
  const [title, setTitle] = useState('');
  const [type, setType] = useState<
    'PERSONAL' | 'WORK' | 'HEALTH' | 'FINANCE' | 'WORKOUT' | 'STUDY' | 'REMINDER'
  >('PERSONAL');
  const [location, setLocation] = useState('');
  const [color, setColor] = useState('#3b82f6');

  const fetchCalendarData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/calendar?month=${month}&year=${year}`);
      const json = await res.json();
      if (json.success) {
        setItems(json.data.items || []);
      }
    } catch (e) {
      console.error('Erro ao buscar Calendário 360°:', e);
    } finally {
      setLoading(false);
    }
  }, [month, year]);

  useEffect(() => {
    fetchCalendarData();
  }, [fetchCalendarData]);

  const handlePrevMonth = () => {
    if (month === 1) {
      setMonth(12);
      setYear((y) => y - 1);
    } else {
      setMonth((m) => m - 1);
    }
    setSelectedDay(1);
  };

  const handleNextMonth = () => {
    if (month === 12) {
      setMonth(1);
      setYear((y) => y + 1);
    } else {
      setMonth((m) => m + 1);
    }
    setSelectedDay(1);
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    const startDate = new Date(year, month - 1, selectedDay, 10, 0, 0).toISOString();

    await fetch('/api/calendar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: title.trim(),
        type,
        location: location.trim() || null,
        color,
        startDate,
      }),
    });

    setTitle('');
    setLocation('');
    fetchCalendarData();
  };

  const handleToggleEventCompleted = async (ev: any) => {
    await fetch('/api/calendar', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: ev.sourceId,
        isCompleted: !ev.isCompleted,
      }),
    });
    fetchCalendarData();
  };

  const handleDeleteEvent = async (sourceId: string) => {
    await fetch(`/api/calendar?id=${sourceId}`, { method: 'DELETE' });
    fetchCalendarData();
  };

  const firstDayOfWeek = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();

  const filteredItems = items.filter((it) => (layers as any)[it.layer]);

  const getItemsForDay = (day: number) => {
    return filteredItems.filter((it) => {
      const d = new Date(it.date);
      return d.getDate() === day && d.getMonth() + 1 === month && d.getFullYear() === year;
    });
  };

  const selectedDayItems = getItemsForDay(selectedDay);

  const toggleLayer = (key: keyof typeof layers) => {
    setLayers((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="space-y-6">
      {/* Header e Filtros de Camada */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            📅 Calendário Unificado 360°
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Vencimentos financeiros, parcelas, tarefas, sessões de foco, treinos e compromissos.
          </p>
        </div>

        {/* Botões de Camada */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => toggleLayer('FINANCE')}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 border transition-all cursor-pointer ${
              layers.FINANCE
                ? 'bg-emerald-500/15 text-emerald-500 border-emerald-500/40'
                : 'bg-muted text-muted-foreground border-transparent opacity-60'
            }`}
          >
            <Wallet className="h-3.5 w-3.5" /> Finanças
          </button>

          <button
            onClick={() => toggleLayer('EVENTS')}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 border transition-all cursor-pointer ${
              layers.EVENTS
                ? 'bg-blue-500/15 text-blue-500 border-blue-500/40'
                : 'bg-muted text-muted-foreground border-transparent opacity-60'
            }`}
          >
            <CalendarIcon className="h-3.5 w-3.5" /> Eventos
          </button>

          <button
            onClick={() => toggleLayer('TASKS')}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 border transition-all cursor-pointer ${
              layers.TASKS
                ? 'bg-amber-500/15 text-amber-500 border-amber-500/40'
                : 'bg-muted text-muted-foreground border-transparent opacity-60'
            }`}
          >
            <CheckSquare className="h-3.5 w-3.5" /> Tarefas
          </button>

          <button
            onClick={() => toggleLayer('GYM')}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 border transition-all cursor-pointer ${
              layers.GYM
                ? 'bg-cyan-500/15 text-cyan-500 border-cyan-500/40'
                : 'bg-muted text-muted-foreground border-transparent opacity-60'
            }`}
          >
            <Dumbbell className="h-3.5 w-3.5" /> Academia
          </button>

          <button
            onClick={() => toggleLayer('POMODORO')}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 border transition-all cursor-pointer ${
              layers.POMODORO
                ? 'bg-rose-500/15 text-rose-500 border-rose-500/40'
                : 'bg-muted text-muted-foreground border-transparent opacity-60'
            }`}
          >
            <Clock className="h-3.5 w-3.5" /> Foco
          </button>
        </div>
      </div>

      {/* Grid Mensal + Agenda Diária Lateral */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Grade Mensal (8 Colunas) */}
        <div className="lg:col-span-8">
          <Card>
            <CardHeader className="pb-4 flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-bold">
                {MONTH_NAMES[month - 1]} {year}
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={handlePrevMonth}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const d = new Date();
                    setMonth(d.getMonth() + 1);
                    setYear(d.getFullYear());
                    setSelectedDay(d.getDate());
                  }}
                >
                  Hoje
                </Button>
                <Button variant="outline" size="sm" onClick={handleNextMonth}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>

            <CardContent>
              {/* Cabeçalho dos dias da semana */}
              <div className="grid grid-cols-7 gap-1 text-center mb-2">
                {WEEKDAYS.map((w) => (
                  <div key={w} className="text-xs font-bold text-muted-foreground py-1">
                    {w}
                  </div>
                ))}
              </div>

              {/* Células do mês */}
              <div className="grid grid-cols-7 gap-1.5">
                {Array.from({ length: firstDayOfWeek }).map((_, idx) => (
                  <div key={`empty-${idx}`} className="h-20 sm:h-24 rounded-xl bg-muted/20" />
                ))}

                {Array.from({ length: daysInMonth }).map((_, idx) => {
                  const dayNum = idx + 1;
                  const dayItems = getItemsForDay(dayNum);
                  const isSelected = selectedDay === dayNum;
                  const isToday =
                    dayNum === now.getDate() &&
                    month === now.getMonth() + 1 &&
                    year === now.getFullYear();

                  return (
                    <button
                      key={dayNum}
                      onClick={() => setSelectedDay(dayNum)}
                      className={`h-20 sm:h-24 p-1.5 rounded-xl border text-left flex flex-col justify-between transition-all overflow-hidden cursor-pointer ${
                        isSelected
                          ? 'border-primary bg-primary/10 ring-1 ring-primary'
                          : isToday
                          ? 'border-emerald-500/60 bg-emerald-500/5'
                          : 'border-border/60 bg-card hover:bg-muted/40'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span
                          className={`text-xs font-bold px-1.5 py-0.5 rounded-md ${
                            isToday
                              ? 'bg-emerald-500 text-white'
                              : isSelected
                              ? 'text-primary'
                              : 'text-foreground'
                          }`}
                        >
                          {dayNum}
                        </span>
                        {dayItems.length > 0 && (
                          <span className="text-[10px] text-muted-foreground font-mono">
                            {dayItems.length}
                          </span>
                        )}
                      </div>

                      <div className="space-y-0.5 w-full overflow-hidden">
                        {dayItems.slice(0, 2).map((it) => (
                          <div
                            key={it.id}
                            className="text-[10px] truncate px-1 py-0.5 rounded font-medium"
                            style={{
                              backgroundColor: `${it.color}22`,
                              color: it.color,
                            }}
                          >
                            {it.title}
                          </div>
                        ))}
                        {dayItems.length > 2 && (
                          <p className="text-[9px] text-muted-foreground pl-1">
                            +{dayItems.length - 2} mais
                          </p>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Agenda Lateral do Dia Selecionado + Criação Rápida (4 Colunas) */}
        <div className="lg:col-span-4 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold flex items-center justify-between">
                <span>
                  Agenda — Dia {String(selectedDay).padStart(2, '0')}/{String(month).padStart(2, '0')}
                </span>
                <span className="text-xs font-normal text-muted-foreground">
                  {selectedDayItems.length} itens
                </span>
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Form Criação Rápida de Evento */}
              <form
                onSubmit={handleCreateEvent}
                className="p-3 rounded-xl bg-muted/40 border border-border space-y-2.5"
              >
                <p className="text-xs font-bold text-foreground">
                  + Novo Evento no Dia {selectedDay}
                </p>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Título do compromisso..."
                  className="w-full px-3 py-1.5 rounded-lg bg-background border border-input text-xs"
                />
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as any)}
                    className="px-2 py-1.5 rounded-lg bg-background border border-input text-xs"
                  >
                    <option value="PERSONAL">Pessoal</option>
                    <option value="WORK">Trabalho</option>
                    <option value="HEALTH">Saúde</option>
                    <option value="FINANCE">Financeiro</option>
                    <option value="WORKOUT">Treino</option>
                    <option value="STUDY">Estudos</option>
                  </select>

                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Local / Obs..."
                    className="px-2.5 py-1.5 rounded-lg bg-background border border-input text-xs"
                  />
                </div>
                <div className="flex items-center justify-between pt-1">
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="h-7 w-10 rounded cursor-pointer bg-transparent"
                  />
                  <Button type="submit" size="sm" className="h-8 text-xs gap-1">
                    <Plus className="h-3.5 w-3.5" /> Agendar
                  </Button>
                </div>
              </form>

              {/* Itens Cronológicos do Dia */}
              {loading ? (
                <p className="text-xs text-muted-foreground text-center py-6">
                  Sincronizando camadas...
                </p>
              ) : selectedDayItems.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-8">
                  Nenhum item registrado para este dia.
                </p>
              ) : (
                <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
                  {selectedDayItems.map((it) => (
                    <div
                      key={it.id}
                      className="p-3 rounded-xl border border-border bg-card flex items-start justify-between gap-2"
                    >
                      <div className="flex items-start gap-2.5 min-w-0">
                        <div
                          className="h-3 w-3 rounded-full mt-1 shrink-0"
                          style={{ backgroundColor: it.color }}
                        />
                        <div className="min-w-0">
                          <p
                            className={`text-xs font-bold ${
                              it.isCompleted ? 'line-through text-muted-foreground' : 'text-foreground'
                            }`}
                          >
                            {it.title}
                          </p>
                          <p className="text-[11px] text-muted-foreground">{it.subtitle}</p>
                          {it.amount !== undefined && (
                            <p className="text-xs font-bold text-foreground mt-1">
                              {formatCurrency(it.amount)}
                            </p>
                          )}
                        </div>
                      </div>

                      {it.layer === 'EVENTS' && (
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => handleToggleEventCompleted(it)}
                            className="p-1 text-muted-foreground hover:text-emerald-500 cursor-pointer"
                            title="Concluir Evento"
                          >
                            <CheckCircle2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteEvent(it.sourceId)}
                            className="p-1 text-muted-foreground hover:text-destructive cursor-pointer"
                            title="Excluir Evento"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
