'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  FileText,
  Folder,
  FolderPlus,
  Plus,
  Search,
  Pin,
  Star,
  Calendar,
  Trash2,
  Eye,
  Edit3,
  CheckSquare,
  Square,
  Save,
  ChevronLeft,
  Tag,
  Hash,
  Sparkles,
  Columns,
  List,
  Heading1,
  Heading2,
  Bold,
  Italic,
  Quote,
  Code,
  ListTodo,
} from 'lucide-react';

export function NotesModuleView() {
  const [notes, setNotes] = useState<any[]>([]);
  const [folders, setFolders] = useState<any[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [activeNote, setActiveNote] = useState<any | null>(null);
  const [viewMode, setViewMode] = useState<'EDIT' | 'PREVIEW' | 'SPLIT'>('EDIT');
  const [saving, setSaving] = useState(false);
  const [mobileScreen, setMobileScreen] = useState<'LIST' | 'EDITOR'>('LIST');

  // Novo folder
  const [showFolderForm, setShowFolderForm] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  // Campos de edição da nota ativa
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editTags, setEditTags] = useState('');
  const [editFolderId, setEditFolderId] = useState('');

  const fetchNotes = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.set('q', searchQuery.trim());
      if (selectedFolder !== 'ALL') params.set('folderId', selectedFolder);
      if (selectedTag) params.set('tag', selectedTag);

      const res = await fetch(`/api/notes?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        const list = json.data.notes || [];
        setNotes(list);
        setFolders(json.data.folders || []);

        if (!activeNote && list.length > 0) {
          selectNoteForEdit(list[0]);
        }
      }
    } catch (e) {
      console.error('Erro ao buscar notas:', e);
    }
  }, [searchQuery, selectedFolder, selectedTag, activeNote]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  const selectNoteForEdit = (note: any) => {
    setActiveNote(note);
    setEditTitle(note.title || '');
    setEditContent(note.content || '');
    setEditTags((note.tags || []).join(', '));
    setEditFolderId(note.folderId || '');
  };

  const handleOpenNoteOnMobile = (note: any) => {
    selectNoteForEdit(note);
    setMobileScreen('EDITOR');
  };

  const handleCreateNewNote = async () => {
    try {
      const res = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Nova Nota sem Título',
          content: '# Nova Nota\n\nComece a escrever suas ideias ou adicione um checklist:\n- [ ] Primeira tarefa da nota\n',
          folderId: selectedFolder !== 'ALL' ? selectedFolder : null,
          tags: ['geral'],
        }),
      });
      const json = await res.json();
      if (json.success) {
        await fetchNotes();
        selectNoteForEdit(json.data);
        setMobileScreen('EDITOR');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleOpenDailyNote = async () => {
    try {
      const res = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'OPEN_DAILY_NOTE' }),
      });
      const json = await res.json();
      if (json.success) {
        await fetchNotes();
        selectNoteForEdit(json.data);
        setMobileScreen('EDITOR');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveActiveNote = async (contentToSave?: string) => {
    if (!activeNote) return;
    try {
      setSaving(true);
      const tagArray = editTags
        .split(',')
        .map((t) => t.trim().toLowerCase())
        .filter((t) => t.length > 0);

      const res = await fetch(`/api/notes/${activeNote.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editTitle.trim() || 'Sem título',
          content: contentToSave !== undefined ? contentToSave : editContent,
          folderId: editFolderId || null,
          tags: tagArray,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setActiveNote(json.data);
        fetchNotes();
      }
    } catch (e) {
      console.error('Erro ao salvar nota:', e);
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePin = async () => {
    if (!activeNote) return;
    try {
      const nextPin = !activeNote.isPinned;
      await fetch(`/api/notes/${activeNote.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPinned: nextPin }),
      });
      setActiveNote({ ...activeNote, isPinned: nextPin });
      fetchNotes();
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleFavorite = async () => {
    if (!activeNote) return;
    try {
      const nextFav = !activeNote.isFavorite;
      await fetch(`/api/notes/${activeNote.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isFavorite: nextFav }),
      });
      setActiveNote({ ...activeNote, isFavorite: nextFav });
      fetchNotes();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteActiveNote = async () => {
    if (!activeNote || !confirm(`Deseja realmente excluir a nota "${activeNote.title}"?`)) return;
    try {
      await fetch(`/api/notes/${activeNote.id}`, { method: 'DELETE' });
      setActiveNote(null);
      setMobileScreen('LIST');
      fetchNotes();
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    try {
      const res = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'CREATE_FOLDER',
          name: newFolderName.trim(),
          color: '#3b82f6',
        }),
      });
      const json = await res.json();
      if (json.success) {
        setNewFolderName('');
        setShowFolderForm(false);
        fetchNotes();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Inserção rápida de sintaxe Markdown no editor (estilo Notion)
  const insertMarkdownSnippet = (prefix: string, suffix: string = '') => {
    setEditContent((prev) => `${prev}\n${prefix} ${suffix}`);
  };

  // Alternar checkbox interativo no preview
  const handleToggleChecklistInPreview = async (lineIndex: number) => {
    const lines = editContent.split('\n');
    const line = lines[lineIndex];
    if (line.includes('- [ ]')) {
      lines[lineIndex] = line.replace('- [ ]', '- [x]');
    } else if (line.includes('- [x]') || line.includes('- [X]')) {
      lines[lineIndex] = line.replace(/- \[[xX]\]/, '- [ ]');
    }
    const updated = lines.join('\n');
    setEditContent(updated);
    await handleSaveActiveNote(updated);
  };

  const allTags = Array.from(new Set(notes.flatMap((n) => n.tags || [])));

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-card border border-border/80 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              Segundo Cérebro & Notas
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Ambiente minimalista de escrita com Markdown, checklists clicáveis e pastas temáticas.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            onClick={handleOpenDailyNote}
            variant="outline"
            size="sm"
            className="gap-2 border-amber-500/40 text-amber-500 hover:bg-amber-500/10 font-semibold text-xs sm:text-sm"
          >
            <Calendar className="h-4 w-4" />
            ⚡ Nota de Hoje
          </Button>

          <Button onClick={handleCreateNewNote} size="sm" className="gap-2 font-bold text-xs sm:text-sm">
            <Plus className="h-4 w-4" />
            Nova Nota
          </Button>
        </div>
      </div>

      {/* Grid de 3 Colunas Apple Notes / Notion (Desktop) ou Drill-Down (Mobile) */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 min-h-[640px]">
        {/* COLUNA 1: Pastas & Tags (Oculta no mobile se estiver no editor) */}
        <div
          className={`md:col-span-3 space-y-4 ${
            mobileScreen === 'EDITOR' ? 'hidden md:block' : 'block'
          }`}
        >
          <Card className="h-full bg-card/75 backdrop-blur-xl border-border/70">
            <CardContent className="p-4 space-y-4">
              {/* Botão de destaque Nota de Hoje */}
              <button
                onClick={handleOpenDailyNote}
                className="w-full p-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-500 text-xs font-bold flex items-center justify-between transition-all cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>Diário de Hoje</span>
                </div>
                <span className="text-[10px] bg-amber-500/20 px-2 py-0.5 rounded-md">Abrir</span>
              </button>

              {/* Seção de Pastas */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs px-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    Pastas
                  </span>
                  <button
                    onClick={() => setShowFolderForm(!showFolderForm)}
                    className="text-xs text-primary hover:underline flex items-center gap-1 cursor-pointer font-semibold"
                  >
                    <FolderPlus className="h-3.5 w-3.5" /> Nova
                  </button>
                </div>

                {showFolderForm && (
                  <form onSubmit={handleCreateFolder} className="flex gap-1.5 pt-1">
                    <input
                      type="text"
                      required
                      value={newFolderName}
                      onChange={(e) => setNewFolderName(e.target.value)}
                      placeholder="Nome da pasta..."
                      className="flex-1 px-2.5 py-1 rounded-lg bg-background border border-border text-xs text-foreground outline-none focus:ring-1 focus:ring-primary"
                    />
                    <Button type="submit" size="sm" className="h-7 text-xs px-2.5">
                      Criar
                    </Button>
                  </form>
                )}

                <div className="space-y-1 pt-1">
                  <button
                    onClick={() => setSelectedFolder('ALL')}
                    className={`w-full px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between transition-all cursor-pointer ${
                      selectedFolder === 'ALL'
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      <span>Todas as Notas</span>
                    </div>
                    <span className="text-[10px] opacity-80">{notes.length}</span>
                  </button>

                  {folders.map((f) => (
                    <button
                      key={f.id}
                      onClick={() => setSelectedFolder(f.id)}
                      className={`w-full px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between transition-all cursor-pointer ${
                        selectedFolder === f.id
                          ? 'bg-primary text-primary-foreground shadow-sm'
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <Folder className="h-4 w-4 shrink-0" style={{ color: f.color || '#3b82f6' }} />
                        <span className="truncate">{f.name}</span>
                      </div>
                      <span className="text-[10px] opacity-80">
                        {notes.filter((n) => n.folderId === f.id).length}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Tags Cloud */}
              {allTags.length > 0 && (
                <div className="pt-3 border-t border-border/70 space-y-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block px-1">
                    Tags
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {allTags.map((tag) => (
                      <button
                        key={tag}
                        onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border transition-all cursor-pointer ${
                          selectedTag === tag
                            ? 'bg-primary/20 text-primary border-primary shadow-xs'
                            : 'bg-muted/40 text-muted-foreground border-border hover:text-foreground'
                        }`}
                      >
                        #{tag}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* COLUNA 2: Lista de Notas (Oculta no mobile se estiver no editor) */}
        <div
          className={`md:col-span-4 space-y-3 ${
            mobileScreen === 'EDITOR' ? 'hidden md:block' : 'block'
          }`}
        >
          <Card className="h-full bg-card/75 backdrop-blur-xl border-border/70 flex flex-col">
            <CardContent className="p-4 flex-1 flex flex-col space-y-3 min-h-0">
              {/* Barra de Busca Linear */}
              <div className="relative">
                <Search className="h-4 w-4 text-muted-foreground absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar no título ou conteúdo..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-background border border-border text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              {/* Lista Scrollável de Notas */}
              <div className="space-y-2 flex-1 overflow-y-auto pr-1">
                {notes.length === 0 ? (
                  <div className="p-8 text-center rounded-xl border border-dashed border-border text-muted-foreground space-y-2">
                    <FileText className="h-8 w-8 mx-auto opacity-50" />
                    <p className="text-xs font-semibold">Nenhuma nota encontrada.</p>
                  </div>
                ) : (
                  notes.map((n) => {
                    const isSelected = activeNote?.id === n.id;
                    const previewText = (n.content || '')
                      .replace(/#|\*|`|\[ \]|\[x\]/g, '')
                      .trim()
                      .substring(0, 90);

                    return (
                      <div
                        key={n.id}
                        onClick={() => handleOpenNoteOnMobile(n)}
                        className={`p-3.5 rounded-xl border transition-all cursor-pointer text-left space-y-1.5 ${
                          isSelected
                            ? 'bg-primary/10 border-primary shadow-xs'
                            : 'bg-card border-border/70 hover:border-border hover:bg-muted/40'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="text-xs font-bold text-foreground leading-snug line-clamp-1">
                            {n.title}
                          </h4>
                          <div className="flex items-center gap-1 shrink-0">
                            {n.isPinned && <Pin className="h-3 w-3 text-amber-500 fill-amber-500" />}
                            {n.isFavorite && <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />}
                          </div>
                        </div>

                        {previewText && (
                          <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                            {previewText}
                          </p>
                        )}

                        <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1">
                          <span>{new Date(n.updatedAt).toLocaleDateString('pt-BR')}</span>
                          {(n.tags || []).length > 0 && (
                            <div className="flex gap-1 truncate max-w-[120px]">
                              {n.tags.slice(0, 2).map((t: string) => (
                                <span key={t} className="bg-muted px-1.5 py-0.2 rounded text-[9px]">
                                  #{t}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* COLUNA 3: Editor / Visualizador Distraction-Free */}
        <div
          className={`md:col-span-5 ${
            mobileScreen === 'LIST' ? 'hidden md:block' : 'block'
          }`}
        >
          {activeNote ? (
            <Card className="h-full bg-card/90 backdrop-blur-xl border-border/70 flex flex-col min-h-[580px]">
              {/* Header do Editor */}
              <div className="p-3.5 sm:p-4 border-b border-border/70 flex items-center justify-between gap-2 flex-wrap">
                {/* Botão de voltar no mobile */}
                <button
                  onClick={() => setMobileScreen('LIST')}
                  className="md:hidden flex items-center gap-1 text-xs text-primary font-bold pr-2"
                >
                  <ChevronLeft className="h-4 w-4" /> Voltar
                </button>

                {/* Alternador de Modo: Editar / Prévia / Dividido */}
                <div className="flex items-center p-0.5 rounded-lg bg-muted border border-border/60 text-xs">
                  <button
                    onClick={() => setViewMode('EDIT')}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                      viewMode === 'EDIT'
                        ? 'bg-background text-foreground shadow-xs'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => setViewMode('PREVIEW')}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                      viewMode === 'PREVIEW'
                        ? 'bg-background text-foreground shadow-xs'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Prévia
                  </button>
                  <button
                    onClick={() => setViewMode('SPLIT')}
                    className={`hidden lg:inline-flex px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                      viewMode === 'SPLIT'
                        ? 'bg-background text-foreground shadow-xs'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Dividido
                  </button>
                </div>

                {/* Ações Rápidas: Fixar, Favoritar, Salvar, Excluir */}
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={handleTogglePin}
                    className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                      activeNote.isPinned
                        ? 'border-amber-500/40 bg-amber-500/10 text-amber-500'
                        : 'border-border text-muted-foreground hover:text-foreground'
                    }`}
                    title="Fixar no topo"
                  >
                    <Pin className="h-3.5 w-3.5" />
                  </button>

                  <button
                    onClick={handleToggleFavorite}
                    className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                      activeNote.isFavorite
                        ? 'border-yellow-500/40 bg-yellow-500/10 text-yellow-500'
                        : 'border-border text-muted-foreground hover:text-foreground'
                    }`}
                    title="Favoritar nota"
                  >
                    <Star className="h-3.5 w-3.5" />
                  </button>

                  <Button
                    size="sm"
                    onClick={() => handleSaveActiveNote()}
                    disabled={saving}
                    className="h-8 text-xs font-bold gap-1.5"
                  >
                    <Save className="h-3.5 w-3.5" />
                    {saving ? 'Salvando...' : 'Salvar'}
                  </Button>

                  <button
                    onClick={handleDeleteActiveNote}
                    className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                    title="Excluir nota"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Barra de Formatação Rápida Notion-Style */}
              <div className="px-4 py-2 border-b border-border/50 bg-muted/20 flex items-center gap-1 overflow-x-auto text-xs">
                <button
                  type="button"
                  onClick={() => insertMarkdownSnippet('# ')}
                  className="px-2 py-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground font-bold"
                  title="Título H1"
                >
                  <Heading1 className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => insertMarkdownSnippet('## ')}
                  className="px-2 py-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground font-bold"
                  title="Título H2"
                >
                  <Heading2 className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => insertMarkdownSnippet('**', '**')}
                  className="px-2 py-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
                  title="Negrito"
                >
                  <Bold className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => insertMarkdownSnippet('*', '*')}
                  className="px-2 py-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
                  title="Itálico"
                >
                  <Italic className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => insertMarkdownSnippet('- [ ] ')}
                  className="px-2 py-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground flex items-center gap-1 font-semibold"
                  title="Checklist"
                >
                  <ListTodo className="h-3.5 w-3.5 text-primary" />
                  <span>Checklist</span>
                </button>
                <button
                  type="button"
                  onClick={() => insertMarkdownSnippet('> ')}
                  className="px-2 py-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
                  title="Citação"
                >
                  <Quote className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => insertMarkdownSnippet('```\n', '\n```')}
                  className="px-2 py-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
                  title="Código"
                >
                  <Code className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Corpo do Editor e/ou Preview */}
              <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4">
                {/* Título sem bordas */}
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="Título da nota..."
                  className="w-full bg-transparent text-xl sm:text-2xl font-extrabold tracking-tight text-foreground outline-none border-none placeholder:text-muted-foreground/50"
                />

                {/* Tags e Pasta */}
                <div className="flex flex-wrap items-center gap-2 pt-1 border-b border-border/50 pb-3 text-xs">
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Folder className="h-3.5 w-3.5 text-primary" />
                    <select
                      value={editFolderId}
                      onChange={(e) => setEditFolderId(e.target.value)}
                      className="bg-transparent text-xs text-foreground outline-none cursor-pointer"
                    >
                      <option value="">Sem Pasta (Geral)</option>
                      {folders.map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center gap-1 text-muted-foreground pl-2 border-l border-border/50">
                    <Tag className="h-3.5 w-3.5 text-primary" />
                    <input
                      type="text"
                      value={editTags}
                      onChange={(e) => setEditTags(e.target.value)}
                      placeholder="Tags separadas por vírgula..."
                      className="bg-transparent text-xs text-foreground outline-none placeholder:text-muted-foreground/50 w-44"
                    />
                  </div>
                </div>

                {/* Conteúdo: Edit / Preview / Split */}
                {viewMode === 'EDIT' && (
                  <textarea
                    rows={18}
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    placeholder="Escreva em Markdown livremente..."
                    className="w-full h-[400px] bg-transparent text-sm leading-relaxed text-foreground/90 outline-none resize-none placeholder:text-muted-foreground/40 font-mono"
                  />
                )}

                {viewMode === 'PREVIEW' && (
                  <div className="prose prose-sm dark:prose-invert max-w-none space-y-2">
                    {editContent.split('\n').map((line, idx) => {
                      if (line.startsWith('# ')) {
                        return (
                          <h1 key={idx} className="text-xl font-extrabold text-foreground mt-4 mb-2">
                            {line.substring(2)}
                          </h1>
                        );
                      }
                      if (line.startsWith('## ')) {
                        return (
                          <h2 key={idx} className="text-lg font-bold text-foreground mt-3 mb-1">
                            {line.substring(3)}
                          </h2>
                        );
                      }
                      if (line.startsWith('- [ ]') || line.startsWith('- [x]')) {
                        const checked = line.startsWith('- [x]');
                        const text = line.substring(5).trim();
                        return (
                          <div
                            key={idx}
                            onClick={() => handleToggleChecklistInPreview(idx)}
                            className="flex items-center gap-2.5 py-1 text-xs cursor-pointer hover:bg-muted/30 px-2 rounded-lg transition-colors"
                          >
                            {checked ? (
                              <CheckSquare className="h-4 w-4 text-emerald-500 shrink-0" />
                            ) : (
                              <Square className="h-4 w-4 text-muted-foreground shrink-0" />
                            )}
                            <span
                              className={
                                checked ? 'line-through text-muted-foreground' : 'text-foreground font-medium'
                              }
                            >
                              {text}
                            </span>
                          </div>
                        );
                      }
                      if (line.startsWith('> ')) {
                        return (
                          <blockquote
                            key={idx}
                            className="border-l-2 border-primary pl-3 py-1 text-xs italic text-muted-foreground my-2"
                          >
                            {line.substring(2)}
                          </blockquote>
                        );
                      }
                      return (
                        <p key={idx} className="text-xs text-foreground/80 leading-relaxed">
                          {line}
                        </p>
                      );
                    })}
                  </div>
                )}

                {viewMode === 'SPLIT' && (
                  <div className="grid grid-cols-2 gap-4 h-[400px]">
                    <textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="w-full h-full bg-muted/20 p-3 rounded-xl border border-border text-xs leading-relaxed text-foreground font-mono outline-none resize-none"
                    />
                    <div className="h-full overflow-y-auto p-3 rounded-xl border border-border bg-card space-y-1.5">
                      {editContent.split('\n').map((line, idx) => (
                        <p key={idx} className="text-xs text-foreground/90">
                          {line}
                        </p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Card>
          ) : (
            <Card className="h-full flex items-center justify-center p-12 text-center border-dashed">
              <div className="space-y-2 text-muted-foreground">
                <FileText className="h-10 w-10 mx-auto opacity-40" />
                <h4 className="text-sm font-semibold text-foreground">Nenhuma nota selecionada</h4>
                <p className="text-xs">Selecione uma nota na lista ou crie uma nova.</p>
                <Button size="sm" onClick={handleCreateNewNote} className="gap-1 mt-2 font-bold">
                  <Plus className="h-4 w-4" /> Nova Nota
                </Button>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}