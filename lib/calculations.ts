import { PROFESSION_BY_ID, RULES, STOCK_BY_ID } from "./configs";
import type {
  PlayerState,
  Profession,
  ProfessionLiabilityKey,
} from "./types";

export function getProfession(id: string): Profession {
  const p = PROFESSION_BY_ID[id];
  if (!p) throw new Error(`Unknown profession id: ${id}`);
  return p;
}

// ───────── расходы ─────────

export function childrenExpense(p: PlayerState, prof: Profession): number {
  return p.childrenCount * prof.expenses.perChild;
}

export function bankLoanMonthlyPayment(p: PlayerState): number {
  const blocks = p.bankLoanAmount / RULES.bankLoan.step;
  return blocks * RULES.bankLoan.monthlyPaymentPer1000;
}

export function isLiabilityPaidOff(
  p: PlayerState,
  key: ProfessionLiabilityKey,
): boolean {
  return (p.paidOffLiabilities ?? []).includes(key);
}

/** Эффективная сумма пассива (0 если погашен досрочно). */
export function effectiveLiability(
  p: PlayerState,
  prof: Profession,
  key: ProfessionLiabilityKey,
): number {
  return isLiabilityPaidOff(p, key) ? 0 : prof.liabilities[key];
}

/** Эффективный ежемесячный расход (0 если соответствующий пассив погашен). */
export function effectiveExpense(
  p: PlayerState,
  prof: Profession,
  key: ProfessionLiabilityKey,
): number {
  return isLiabilityPaidOff(p, key) ? 0 : prof.expenses[key];
}

/** Сумма всех статей расхода: статичные из профессии (с учётом погашений) + дети + кредит банка. */
export function totalExpenses(p: PlayerState, prof: Profession): number {
  const e = prof.expenses;
  return (
    e.taxes +
    effectiveExpense(p, prof, "mortgage") +
    effectiveExpense(p, prof, "schoolLoan") +
    effectiveExpense(p, prof, "carLoan") +
    effectiveExpense(p, prof, "creditCards") +
    effectiveExpense(p, prof, "otherLoans") +
    e.other +
    childrenExpense(p, prof) +
    bankLoanMonthlyPayment(p)
  );
}

// ───────── пассивные доходы ─────────

export function stocksDividends(p: PlayerState): number {
  return p.stocks.reduce((sum, s) => {
    const tpl = STOCK_BY_ID[s.templateId];
    return sum + (tpl?.dividendPerShare ?? 0) * s.shares;
  }, 0);
}

export function realEstateCashflow(p: PlayerState): number {
  return p.realEstate.reduce((s, r) => s + r.monthlyCashflow, 0);
}

export function businessCashflow(p: PlayerState): number {
  return p.businesses.reduce((s, b) => s + b.monthlyCashflow, 0);
}

export function passiveIncome(p: PlayerState): number {
  return stocksDividends(p) + realEstateCashflow(p) + businessCashflow(p);
}

// ───────── сводные показатели ─────────

export function totalIncome(p: PlayerState, prof: Profession): number {
  return prof.income.salary + passiveIncome(p);
}

export function monthlyCashflow(p: PlayerState, prof: Profession): number {
  return totalIncome(p, prof) - totalExpenses(p, prof);
}

/** Условие выхода из крысиных гонок: пассивный доход покрывает все расходы. */
export function canExitRatRace(p: PlayerState, prof: Profession): boolean {
  return passiveIncome(p) >= totalExpenses(p, prof);
}

/** Стартовый пассивный доход на Большом круге = округл. до 1000 × 100. */
export function fastTrackInitialPassive(passiveAtExit: number): number {
  return (
    Math.round(passiveAtExit / 1000) *
    1000 *
    RULES.fastTrack.passiveIncomeMultiplier
  );
}

export function fastTrackBusinessCashflow(p: PlayerState): number {
  if (!p.fastTrack) return 0;
  return p.fastTrack.holdings.reduce((s, h) => s + h.monthlyCashflow, 0);
}

/** Полный месячный поток на Большом круге. */
export function fastTrackMonthlyCashflow(p: PlayerState): number {
  if (!p.fastTrack) return 0;
  return p.fastTrack.initialPassiveIncome + fastTrackBusinessCashflow(p);
}

/** Победа на Большом круге: либо +winCashflowDelta к потоку, либо мечта. */
export function fastTrackHasWon(p: PlayerState): boolean {
  if (!p.fastTrack) return false;
  return (
    p.fastTrack.cashflowDeltaSinceStart >= RULES.fastTrack.winCashflowDelta ||
    p.fastTrack.dreamBought
  );
}

// ───────── единая «сводка» для UI ─────────

export type PlayerSummary = {
  profession: Profession;
  salary: number;
  passiveIncome: number;
  totalIncome: number;
  childrenExpense: number;
  bankLoanPayment: number;
  totalExpenses: number;
  monthlyCashflow: number;
  canExitRatRace: boolean;
};

export function summarizePlayer(p: PlayerState): PlayerSummary {
  const prof = getProfession(p.professionId);
  const passive = passiveIncome(p);
  const expenses = totalExpenses(p, prof);
  return {
    profession: prof,
    salary: prof.income.salary,
    passiveIncome: passive,
    totalIncome: prof.income.salary + passive,
    childrenExpense: childrenExpense(p, prof),
    bankLoanPayment: bankLoanMonthlyPayment(p),
    totalExpenses: expenses,
    monthlyCashflow: prof.income.salary + passive - expenses,
    canExitRatRace: passive >= expenses,
  };
}
