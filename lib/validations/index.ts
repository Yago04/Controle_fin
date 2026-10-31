import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().min(2, 'O nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('E-mail inválido'),
  password: z.string().min(6, 'A senha deve ter no mínimo 6 caracteres'),
  monthlyIncome: z.number().nonnegative('A renda não pode ser negativa').optional().default(0),
});

export const loginSchema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(1, 'A senha é obrigatória'),
});

export const accountSchema = z.object({
  name: z.string().min(1, 'Nome da conta é obrigatório'),
  bankName: z.string().optional().nullable(),
  type: z.enum(['CHECKING', 'SAVINGS', 'WALLET', 'DIGITAL', 'INVESTMENT', 'OTHER']).default('CHECKING'),
  initialBalance: z.number().default(0),
  currentBalance: z.number().optional(),
  color: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Cor inválida').default('#3b82f6'),
  isActive: z.boolean().default(true),
  notes: z.string().optional().nullable(),
});

export const transactionSchema = z.object({
  accountId: z.string().uuid('ID de conta inválido'),
  destinationAccountId: z.string().uuid('ID de conta de destino inválido').optional().nullable(),
  categoryId: z.string().uuid('ID de categoria inválido').optional().nullable(),
  description: z.string().min(2, 'Descrição é obrigatória'),
  amount: z.number().positive('O valor deve ser maior que zero'),
  type: z.enum(['INCOME', 'EXPENSE', 'TRANSFER']),
  status: z.enum(['COMPLETED', 'PENDING', 'CANCELLED']).default('COMPLETED'),
  date: z.string().or(z.date()),
  dueDate: z.string().or(z.date()).optional().nullable(),
  paymentMethod: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const debtSchema = z.object({
  creditor: z.string().optional(),
  bankName: z.string().optional().nullable(),
  description: z.string().min(1, 'Descrição é obrigatória'),
  originalAmount: z.number().positive('Valor original deve ser positivo').optional(),
  totalAmount: z.number().positive('Valor total deve ser positivo').optional(),
  currentBalance: z.number().nonnegative('Saldo devedor não pode ser negativo').optional(),
  remainingAmount: z.number().nonnegative('Saldo devedor não pode ser negativo').optional(),
  interestRateMonthly: z.number().nonnegative('Taxa de juros não pode ser negativa').default(0),
  type: z.enum([
    'CREDIT_CARD',
    'LOAN',
    'FINANCING',
    'PERSONAL',
    'BANK',
    'STORE',
    'TAX',
    'OVERDUE_BILL',
    'SETTLEMENT',
    'OTHER',
  ]).default('LOAN'),
  status: z.enum(['ACTIVE', 'NEGOTIATED', 'OVERDUE', 'PAID']).default('ACTIVE'),
  startDate: z.string().or(z.date()).optional(),
  dueDate: z.string().or(z.date()).optional().nullable(),
  totalInstallments: z.number().int().positive().optional(),
  installmentsCount: z.number().int().positive().optional(),
  paidInstallmentsCount: z.number().int().min(0).default(0),
  installmentAmount: z.number().positive('Valor da parcela deve ser positivo').optional(),
  notes: z.string().optional().nullable(),
});

export const canBuySchema = z.object({
  purchaseAmount: z.number().positive('Valor da compra deve ser positivo'),
  installments: z.number().int().positive().default(1),
});
