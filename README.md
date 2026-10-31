# 🏛️ FinControl — Meu Sistema Financeiro Pessoal

> **Sistema Financeiro Pessoal Exclusivo (Uso Local, Não Comercial, Offline-first e Zero Autenticação)**  
> Desenvolvido estritamente de acordo com as especificações do [`prompt.txt`](file:///Users/yagoribeirodeoliveira/Desktop/Projeto%20Financeiro/prompt.txt).

---

## 1. Princípios do Sistema

* **Zero Login / Zero Multi-tenancy:** Sem tela de cadastro, sem login, sem senhas, sem JWT ou cookies. Ao abrir a aplicação, você entra direto no seu **Dashboard Financeiro Pessoal**.
* **100% Local & Privado:** Roda na sua máquina (`localhost`), funciona sem internet e nunca envia dados para APIs externas ou telemetria em nuvem.
* **Precisão Matemática:** Uso estrito de `Decimal(15, 2)` no banco PostgreSQL. Zero imprecisão de ponto flutuante.
* **Transferências Seguras:** Transferências entre suas contas próprias nunca alteram o patrimônio ($\Delta \text{Patrimônio} = 0$).

---

## 2. Perguntas que o Painel Responde Imediatamente

1. **Quanto dinheiro eu tenho?** (Saldo consolidado de todas as contas ativas).
2. **Onde está meu dinheiro?** (Detalhamento por conta: Nubank, Inter, Carteira, etc.).
3. **Quanto já gastei e quanto ainda vou gastar este mês?** (Despesas realizadas vs. Despesas pendentes).
4. **Quanto dinheiro tenho livre?** (Saldo atual + Receitas previstas - Contas a pagar - Parcelas - Metas).
5. **Quanto devo e para quem devo?** (Extrato de todas as dívidas e saldos devedores).
6. **Qual o melhor plano para quitar dívidas?**
   - **Método Avalanche:** Foco na dívida com maior taxa de juros (menor custo financeiro total).
   - **Método Bola de Neve:** Foco no menor saldo devedor (elimina parcelas mais rápido).
7. **Posso comprar?** (Simulador em tempo real que avalia se uma nova compra à vista ou parcelada compromete seu dinheiro livre).

---

## 3. Funcionalidades Implementadas

* **Dashboard Financeiro Completo:** KPIs de saldo, dinheiro livre, saúde financeira, gráficos e resumo.
* **Gestão de Contas Bancárias:** Saldo atualizado atomicamente por transações.
* **Gestão de Transações & Extrato:** Filtros por conta, tipo (receita, despesa, transferência) e busca textual.
* **Contas a Pagar & Aluguel:** Controle de vencimentos e contratos.
* **Dívidas & Parcelas:** Amortização atômica, histórico de parcelas pagas e taxa de juros mensal.
* **Importação Inteligente de Extrato (CSV):**
  - Leitura de extrato bancário
  - Normalização de datas e valores
  - Deduplicação automática ($\pm 2$ dias e mesmo valor)
  - Classificação por regras automáticas (ex: `IFOOD` $\rightarrow$ Alimentação, `UBER` $\rightarrow$ Transporte)
  - Pré-visualização antes de gravar no banco.
* **Backup de Dados (JSON):**
  - **Exportar Backup:** Baixa um arquivo `.json` com todas as contas, transações, categorias, dívidas e regras.
  - **Restaurar Backup:** Carrega o arquivo `.json` com restauração atômica do banco.

---

## 4. Estrutura do Projeto

```text
financial-control/
├── app/
│   ├── api/
│   │   ├── accounts/              # GET e POST de contas bancárias
│   │   ├── transactions/          # GET e POST de transações com saldo atômico
│   │   ├── debts/                 # GET e POST de dívidas
│   │   ├── debts/[id]/pay/        # Liquidação atômica de parcelas
│   │   ├── financial/can-buy/     # Simulador "Posso Comprar?"
│   │   ├── dashboard/overview/    # Agregação completa de métricas (sem login)
│   │   ├── import/preview/        # Parsing CSV, deduplicação e regras
│   │   ├── import/confirm/        # Gravação em lote de transações importadas
│   │   ├── backup/                # Exportação e importação completa em JSON
│   │   ├── categories/            # Categorias do sistema
│   │   └── settings/              # Configurações de renda e metas
│   ├── globals.css                # Estilos Tailwind e tema Dark/Light
│   ├── layout.tsx                 # Layout raiz da aplicação
│   └── page.tsx                   # Dashboard Financeiro Pessoal direto
├── components/
│   ├── ui/                        # Card, Button, Input, Badge
│   ├── layout/                    # Sidebar de navegação e Header
│   └── dashboard/                 # BalanceCards, FinancialHealthCard, DebtsOverviewCard,
│                                  # CanBuySimulator, RecentTransactionsTable,
│                                  # ImportModal, BackupModal
├── domain/
│   └── calculations/
│       └── FinancialCalculator.ts # Regras puras de domínio (sem I/O, 100% testado)
├── services/
│   └── FinancialOverviewService.ts # Orquestração do painel financeiro
├── repositories/                  # Acesso a dados via Prisma (Account, Transaction, Debt)
├── prisma/
│   ├── schema.prisma              # Modelagem relacional estrita sem User
│   └── seed.ts                    # Carga inicial com dados realistas
├── tests/
│   └── unit/                      # Testes unitários com Vitest (100% passando)
├── docker-compose.yml             # PostgreSQL 16 local
└── README.md
```

---

## 5. Como Executar

### 1. Iniciar o Banco PostgreSQL Local via Docker
```bash
docker compose up -d postgres
```

### 2. Executar Migrações e Seed Inicial
```bash
npx prisma db push
npm run db:seed
```

### 3. Executar Testes Unitários de Regras de Domínio
```bash
npm test
```

### 4. Iniciar a Aplicação
```bash
npm run dev
```

Acesse imediatamente no navegador:
👉 **[http://localhost:3000](http://localhost:3000)** (abre direto no seu Dashboard pessoal, sem tela de login!)
