import { z } from "zod";

const money = z.number().nonnegative();
const slug = z.string().min(1).regex(/^[a-z0-9][a-z0-9-]*$/, "id должен быть kebab-case");

export const ProfessionSchema = z.object({
  id: slug,
  name: z.string().min(1),
  income: z.object({
    salary: money,
  }),
  expenses: z.object({
    taxes: money,
    mortgage: money,
    schoolLoan: money,
    carLoan: money,
    creditCards: money,
    otherLoans: money,
    other: money,
    perChild: money,
  }),
  assets: z.object({
    savings: money,
  }),
  liabilities: z.object({
    mortgage: money,
    schoolLoan: money,
    carLoan: money,
    creditCards: money,
    otherLoans: money,
  }),
});

export const StockTemplateSchema = z.object({
  id: slug,
  ticker: z.string().min(1),
  hasDeposit: z.boolean(),
  dividendPerShare: money,
});

export const DealTemplateSchema = z.object({
  id: slug,
  name: z.string().min(1),
});

export const FastTrackBusinessSchema = z.object({
  id: slug,
  name: z.string().min(1),
  kind: z.enum(["monthly", "oneTime"]),
  amount: z.number().positive(),
  downPayment: money,
  diceRequired: z.number().int().min(1).max(12).optional(),
});

export const RulesSchema = z.object({
  maxChildren: z.number().int().nonnegative(),
  maxProfileSlots: z.number().int().positive(),
  bankLoan: z.object({
    step: z.number().int().positive(),
    repayStep: z.number().int().positive(),
    monthlyPaymentPer1000: z.number().nonnegative(),
  }),
  fastTrack: z.object({
    passiveIncomeMultiplier: z.number().positive(),
    winCashflowDelta: z.number().positive(),
  }),
  charity: z.object({
    incomePercent: z.number().min(0).max(100),
    turnsWithExtraDice: z.number().int().nonnegative(),
  }),
  downsize: z.object({
    skipTurns: z.number().int().nonnegative(),
  }),
  bankruptcy: z.object({
    skipTurns: z.number().int().nonnegative(),
  }),
});

export type Profession = z.infer<typeof ProfessionSchema>;
export type StockTemplate = z.infer<typeof StockTemplateSchema>;
export type DealTemplate = z.infer<typeof DealTemplateSchema>;
export type FastTrackBusiness = z.infer<typeof FastTrackBusinessSchema>;
export type Rules = z.infer<typeof RulesSchema>;

export const ProfessionListSchema = z.array(ProfessionSchema).nonempty();
export const StockListSchema = z.array(StockTemplateSchema).nonempty();
export const DealListSchema = z.array(DealTemplateSchema).nonempty();
export const FastTrackListSchema = z.array(FastTrackBusinessSchema).nonempty();
