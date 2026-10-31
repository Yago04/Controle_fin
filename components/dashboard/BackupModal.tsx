'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { DownloadCloud, UploadCloud, ShieldAlert, CheckCircle2, X } from 'lucide-react';

interface BackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRestored: () => void;
}

export function BackupModal({ isOpen, onClose, onRestored }: BackupModalProps) {
  const [restoring, setRestoring] = useState(false);
  const [downloading, setDownloading] = useState(false);

  if (!isOpen) return null;

  const handleExport = async () => {
    try {
      setDownloading(true);
      const res = await fetch('/api/backup');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backup-financeiro-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (e: any) {
      alert('Erro ao exportar backup: ' + e.message);
    } finally {
      setDownloading(false);
    }
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!confirm('Atenção: A restauração substituirá os dados atuais pelo arquivo importado. Deseja continuar?')) {
      return;
    }

    try {
      setRestoring(true);
      const text = await file.text();
      const json = JSON.parse(text);

      const res = await fetch('/api/backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(json),
      });

      const data = await res.json();
      if (data.success) {
        alert('Backup restaurado com sucesso!');
        onRestored();
        onClose();
      } else {
        alert(data.error || 'Erro ao restaurar backup');
      }
    } catch (err: any) {
      alert('Falha ao processar arquivo de backup: ' + err.message);
    } finally {
      setRestoring(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <Card className="w-full max-w-lg bg-card border-border shadow-2xl">
        <CardHeader className="flex flex-row items-center justify-between pb-3 border-b">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <DownloadCloud className="h-5 w-5 text-primary" />
              Backup do Sistema Financeiro
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              Privacidade total: seus dados em formato JSON sob seu controle.
            </p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          {/* Opção 1: Exportar */}
          <div className="p-4 rounded-xl border border-border bg-muted/20 space-y-3">
            <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <DownloadCloud className="h-4 w-4 text-emerald-500" />
              Exportar Meus Dados (Download JSON)
            </h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Gera um arquivo com todas as suas contas, transações, regras, dívidas e categorias para armazenamento seguro no seu computador.
            </p>
            <Button
              onClick={handleExport}
              disabled={downloading}
              className="w-full gap-2"
            >
              <DownloadCloud className="h-4 w-4" />
              {downloading ? 'Gerando arquivo...' : 'Baixar Arquivo JSON'}
            </Button>
          </div>

          {/* Opção 2: Importar / Restaurar */}
          <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/5 space-y-3">
            <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <UploadCloud className="h-4 w-4 text-amber-500" />
              Restaurar Dados Anteriores
            </h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Carregue um arquivo JSON gerado anteriormente para restaurar seu histórico completo.
            </p>
            <label className="block">
              <Button
                variant="outline"
                className="w-full gap-2 cursor-pointer relative"
                disabled={restoring}
              >
                <UploadCloud className="h-4 w-4" />
                {restoring ? 'Restaurando...' : 'Selecionar Arquivo JSON'}
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportFile}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
              </Button>
            </label>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
