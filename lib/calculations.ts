import { PROFESSION_BY_ID, RULES, STOCK_BY_ID } from "./configs";
import type { PlayerState, Profession } from "./types";

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

/** Сумма всех статей расхода: статичные из профессии + дети + кредит банка. */
export function totalExpenses(p: PlayerState, prof: Profession): number {
  const e = prof.expenses;
  return (
    e.taxes +
    e.mortgage +
    e.schoolLoan +
    e.carLoan +
    e.creditCards +
    e.otherLoans +
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
