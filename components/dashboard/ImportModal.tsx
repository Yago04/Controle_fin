'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Upload, AlertTriangle, CheckCircle, FileText, X } from 'lucide-react';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: Array<{ id: string; name: string }>;
  onSuccess: () => void;
}

export function ImportModal({ isOpen, onClose, accounts, onSuccess }: ImportModalProps) {
  const [selectedAccountId, setSelectedAccountId] = useState(accounts[0]?.id || '');
  const [csvText, setCsvText] = useState('');
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [previewItems, setPreviewItems] = useState<any[]>([]);

  if (!isOpen) return null;

  const handlePreview = async () => {
    if (!csvText.trim()) return;
    try {
      setLoadingPreview(true);
      const res = await fetch('/api/import/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ csvContent: csvText, accountId: selectedAccountId }),
      });
      const data = await res.json();
      if (data.success) {
        setPreviewItems(data.items);
      } else {
        alert(data.error || 'Erro ao processar CSV');
      }
    } catch (e: any) {
      alert('Falha na comunicação com o servidor: ' + e.message);
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleConfirm = async () => {
    if (!selectedAccountId || previewItems.length === 0) return;
    try {
      setConfirming(true);
      const res = await fetch('/api/import/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountId: selectedAccountId,
          items: previewItems.map((item) => ({
            date: item.date,
            description: item.description,
            amount: item.amount,
            type: item.type,
            categoryId: item.suggestedCategoryId,
            isDuplicate: item.isDuplicate,
          })),
        }),
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message || 'Transações importadas com sucesso!');
        onSuccess();
        onClose();
      } else {
        alert(data.error || 'Erro ao salvar importação');
      }
    } catch (e: any) {
      alert('Falha ao confirmar importação: ' + e.message);
    } finally {
      setConfirming(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <Card className="w-full max-w-3xl max-h-[90vh] flex flex-col bg-card border-border shadow-2xl">
        <CardHeader className="flex flex-row items-center justify-between pb-3 border-b">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Upload className="h-5 w-5 text-primary" />
              Importação Inteligente de Extrato (CSV)
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              Normalização, deduplicação automática e classificação com regras.
            </p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </CardHeader>

        <CardContent className="flex-1 overflow-y-auto p-6 space-y-5">
          {previewItems.length === 0 ? (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-foreground mb-1 block">
                  Conta de Destino:
                </label>
                <select
                  value={selectedAccountId}
                  onChange={(e) => setSelectedAccountId(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border bg-background text-foreground text-sm"
                >
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground mb-1 block">
                  Cole o conteúdo do CSV (formato: Data, Descrição, Valor):
                </label>
                <textarea
                  value={csvText}
                  onChange={(e) => setCsvText(e.target.value)}
                  placeholder={`Data,Descrição,Valor\n08/10/2026,PIX Recebido Cliente,1500.00\n09/10/2026,IFOOD BRASIL,-48.90\n10/10/2026,UBER TRIP,-26.50`}
                  rows={8}
                  className="w-full p-3 font-mono text-xs rounded-lg border bg-background text-foreground focus:ring-2 focus:ring-primary"
                />
              </div>

              <Button
                onClick={handlePreview}
                disabled={loadingPreview || !csvText.trim()}
                className="w-full"
              >
                {loadingPreview ? 'Analisando CSV...' : 'Processar & Pré-visualizar'}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground">
                  {previewItems.length} transações identificadas
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPreviewItems([])}
                >
                  Voltar e Colar Novamente
                </Button>
              </div>

              <div className="border rounded-lg overflow-hidden max-h-72 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-muted text-muted-foreground font-semibold">
                    <tr>
                      <th className="p-2.5">Data</th>
                      <th className="p-2.5">Descrição</th>
                      <th className="p-2.5">Valor</th>
                      <th className="p-2.5">Categoria Sugerida</th>
                      <th className="p-2.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {previewItems.map((item) => (
                      <tr
                        key={item.tempId}
                        className={item.isDuplicate ? 'bg-amber-500/10' : ''}
                      >
                        <td className="p-2.5">{formatDate(item.date)}</td>
                        <td className="p-2.5 font-medium">{item.description}</td>
                        <td
                          className={`p-2.5 font-semibold ${
                            item.type === 'INCOME' ? 'text-emerald-500' : 'text-rose-500'
                          }`}
                        >
                          {item.type === 'INCOME' ? '+' : '-'} {formatCurrency(item.amount)}
                        </td>
                        <td className="p-2.5">
                          {item.suggestedCategoryName ? (
                            <Badge variant="outline" className="text-[10px]">
                              {item.suggestedCategoryName}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground text-[10px]">Sem regra</span>
                          )}
                        </td>
                        <td className="p-2.5">
                          {item.isDuplicate ? (
                            <span
                              className="text-amber-500 text-[10px] flex items-center gap-1 font-semibold"
                              title={item.duplicateReason}
                            >
                              <AlertTriangle className="h-3 w-3" />
                              Duplicata
                            </span>
                          ) : (
                            <span className="text-emerald-500 text-[10px] flex items-center gap-1 font-semibold">
                              <CheckCircle className="h-3 w-3" />
                              Pronto
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <Button
                onClick={handleConfirm}
                disabled={confirming}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {confirming ? 'Gravando transações...' : 'Confirmar e Importar no Banco'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
