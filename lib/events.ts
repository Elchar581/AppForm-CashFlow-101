import { FAST_TRACK_BY_ID, PROFESSION_BY_ID, RULES, STOCK_BY_ID } from "./configs";
import type {
  FastTrackHolding,
  GameEvent,
  OwnedBusiness,
  OwnedRealEstate,
  OwnedStock,
  PlayerState,
  ProfessionLiabilityKey,
} from "./types";

// Локальный пересчёт пассивного дохода — чтобы не создавать импорт из calculations.ts
function passiveAt(p: PlayerState): number {
  let total = 0;
  for (const s of p.stocks) {
    const tpl = STOCK_BY_ID[s.templateId];
    total += (tpl?.dividendPerShare ?? 0) * s.shares;
  }
  for (const r of p.realEstate) total += r.monthlyCashflow;
  for (const b of p.businesses) total += b.monthlyCashflow;
  return total;
}

function makeId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function withEvent(p: PlayerState, evt: GameEvent): GameEvent[] {
  return [...p.history, evt];
}

// ───────── простые события ─────────

export function addChild(p: PlayerState): PlayerState {
  if (p.childrenCount >= RULES.maxChildren) return p;
  return {
    ...p,
    childrenCount: p.childrenCount + 1,
    history: withEvent(p, { kind: "addChild", ts: Date.now() }),
  };
}

export function payday(p: PlayerState, cashflow: number): PlayerState {
  return {
    ...p,
    cash: p.cash + cashflow,
    history: withEvent(p, { kind: "payday", ts: Date.now(), cashflow }),
  };
}

export function doodad(
  p: PlayerState,
  description: string,
  amount: number,
): PlayerState {
  if (amount <= 0) return p;
  return {
    ...p,
    cash: p.cash - amount,
    history: withEvent(p, {
      kind: "doodad",
      ts: Date.now(),
      description,
      amount,
    }),
  };
}

/**
 * Получить финансовую помощь от другого игрока (благотворительность).
 * Просто прибавляет сумму к сбережениям.
 */
export function receiveAid(p: PlayerState, amount: number): PlayerState {
  if (amount <= 0) return p;
  return {
    ...p,
    cash: p.cash + amount,
    history: withEvent(p, {
      kind: "receiveAid",
      ts: Date.now(),
      amount,
    }),
  };
}

// ───────── закрытие пассивов профессии ─────────

/**
 * Полностью погасить статичный пассив профессии (ипотека / кредит на образование / авто и т.д.).
 * Списывает сумму пассива с кэша, помечает пассив как закрытый — соответствующая
 * строка ежемесячного расхода обнуляется.
 *
 * Только в фазе крысиных гонок. Возвращает p без изменений если:
 * - игрок на Большом круге
 * - пассив уже погашен
 * - на счету не хватает денег
 */
export function payOffLiability(
  p: PlayerState,
  key: ProfessionLiabilityKey,
): PlayerState {
  if (p.phase !== "ratRace") return p;
  const prof = PROFESSION_BY_ID[p.professionId];
  if (!prof) return p;
  const already = p.paidOffLiabilities ?? [];
  if (already.includes(key)) return p;
  const amount = prof.liabilities[key];
  if (amount <= 0) return p;
  if (amount > p.cash) return p;
  return {
    ...p,
    cash: p.cash - amount,
    paidOffLiabilities: [...already, key],
    history: withEvent(p, {
      kind: "payOffLiability",
      ts: Date.now(),
      key,
      amount,
    }),
  };
}

// ───────── банковский кредит ─────────

export function takeBankLoan(p: PlayerState, amount: number): PlayerState {
  const step = RULES.bankLoan.step;
  if (amount <= 0 || amount % step !== 0) return p;
  return {
    ...p,
    cash: p.cash + amount,
    bankLoanAmount: p.bankLoanAmount + amount,
    history: withEvent(p, { kind: "takeBankLoan", ts: Date.now(), amount }),
  };
}

export function repayBankLoan(p: PlayerState, amount: number): PlayerState {
  // Погашать можно частично — кратно repayStep ($10), минимум repayStep.
  const repayStep = RULES.bankLoan.repayStep;
  if (amount < repayStep || amount % repayStep !== 0) return p;
  if (amount > p.bankLoanAmount) return p;
  if (amount > p.cash) return p;
  return {
    ...p,
    cash: p.cash - amount,
    bankLoanAmount: p.bankLoanAmount - amount,
    history: withEvent(p, { kind: "repayBankLoan", ts: Date.now(), amount }),
  };
}

// ───────── акции ─────────

export function buyStock(
  p: PlayerState,
  templateId: string,
  shares: number,
  pricePerShare: number,
): PlayerState {
  if (shares <= 0 || pricePerShare < 0) return p;
  const cost = shares * pricePerShare;
  if (cost > p.cash) return p;
  const existing = p.stocks.find((s) => s.templateId === templateId);
  let newStocks: OwnedStock[];
  if (existing) {
    const total = existing.shares + shares;
    const avg =
      (existing.shares * existing.buyPrice + shares * pricePerShare) / total;
    newStocks = p.stocks.map((s) =>
      s.id === existing.id ? { ...s, shares: total, buyPrice: avg } : s,
    );
  } else {
    newStocks = [
      ...p.stocks,
      { id: makeId(), templateId, shares, buyPrice: pricePerShare },
    ];
  }
  return {
    ...p,
    cash: p.cash - cost,
    stocks: newStocks,
    history: withEvent(p, {
      kind: "buyStock",
      ts: Date.now(),
      templateId,
      shares,
      pricePerShare,
    }),
  };
}

export function sellStock(
  p: PlayerState,
  stockId: string,
  shares: number,
  pricePerShare: number,
): PlayerState {
  if (shares <= 0 || pricePerShare < 0) return p;
  const existing = p.stocks.find((s) => s.id === stockId);
  if (!existing || shares > existing.shares) return p;
  const proceeds = shares * pricePerShare;
  const newStocks =
    shares === existing.shares
      ? p.stocks.filter((s) => s.id !== stockId)
      : p.stocks.map((s) =>
          s.id === stockId ? { ...s, shares: s.shares - shares } : s,
        );
  return {
    ...p,
    cash: p.cash + proceeds,
    stocks: newStocks,
    history: withEvent(p, {
      kind: "sellStock",
      ts: Date.now(),
      templateId: existing.templateId,
      shares,
      pricePerShare,
    }),
  };
}

// ───────── недвижимость ─────────

export type BuyRealEstateInput = {
  name: string;
  deck: "small" | "big";
  templateId?: string;
  price: number;
  downPayment: number;
  monthlyCashflow: number;
};

export function buyRealEstate(
  p: PlayerState,
  d: BuyRealEstateInput,
): PlayerState {
  if (d.price <= 0) return p;
  if (d.downPayment < 0 || d.downPayment > d.price) return p;
  if (d.downPayment > p.cash) return p;
  const asset: OwnedRealEstate = {
    id: makeId(),
    name: d.name.trim() || "Недвижимость",
    deck: d.deck,
    templateId: d.templateId,
    price: d.price,
    downPayment: d.downPayment,
    mortgage: d.price - d.downPayment,
    monthlyCashflow: d.monthlyCashflow,
  };
  return {
    ...p,
    cash: p.cash - d.downPayment,
    realEstate: [...p.realEstate, asset],
    history: withEvent(p, {
      kind: "buyRealEstate",
      ts: Date.now(),
      assetId: asset.id,
    }),
  };
}

export function sellRealEstate(
  p: PlayerState,
  assetId: string,
  salePrice: number,
): PlayerState {
  const asset = p.realEstate.find((r) => r.id === assetId);
  if (!asset) return p;
  const proceeds = salePrice - asset.mortgage;
  return {
    ...p,
    cash: p.cash + proceeds,
    realEstate: p.realEstate.filter((r) => r.id !== assetId),
    history: withEvent(p, {
      kind: "sellRealEstate",
      ts: Date.now(),
      assetId,
      salePrice,
    }),
  };
}

// ───────── бизнес ─────────

export type BuyBusinessInput = {
  name: string;
  templateId?: string;
  price: number;
  downPayment: number;
  liability: number;
  monthlyCashflow: number;
};

export function buyBusiness(
  p: PlayerState,
  d: BuyBusinessInput,
): PlayerState {
  if (d.price <= 0) return p;
  if (d.downPayment < 0 || d.downPayment > p.cash) return p;
  const asset: OwnedBusiness = {
    id: makeId(),
    name: d.name.trim() || "Бизнес",
    templateId: d.templateId,
    price: d.price,
    downPayment: d.downPayment,
    liability: d.liability,
    monthlyCashflow: d.monthlyCashflow,
  };
  return {
    ...p,
    cash: p.cash - d.downPayment,
    businesses: [...p.businesses, asset],
    history: withEvent(p, {
      kind: "buyBusiness",
      ts: Date.now(),
      assetId: asset.id,
    }),
  };
}

// ───────── Большой круг ─────────

export function exitRatRace(p: PlayerState): PlayerState {
  if (p.phase === "fastTrack") return p;
  const passive = passiveAt(p);
  const initialPassive =
    Math.round(passive / 1000) * 1000 * RULES.fastTrack.passiveIncomeMultiplier;
  return {
    ...p,
    phase: "fastTrack",
    fastTrack: {
      initialPassiveIncome: initialPassive,
      holdings: [],
      cashflowDeltaSinceStart: 0,
      dreamBought: false,
    },
    history: withEvent(p, {
      kind: "exitRatRace",
      ts: Date.now(),
      passiveIncome: passive,
    }),
  };
}

export function buyFastTrackBusiness(
  p: PlayerState,
  businessId: string,
): PlayerState {
  if (p.phase !== "fastTrack" || !p.fastTrack) return p;
  const biz = FAST_TRACK_BY_ID[businessId];
  if (!biz) return p;
  if (biz.downPayment > p.cash) return p;
  // Нельзя купить тот же бизнес повторно
  if (p.fastTrack.holdings.some((h) => h.businessId === businessId)) return p;

  const isOneTime = biz.kind === "oneTime";
  const recurring = isOneTime ? 0 : biz.amount;
  const oneTimePayout = isOneTime ? biz.amount : 0;
  const holding: FastTrackHolding = {
    id: makeId(),
    businessId,
    monthlyCashflow: recurring,
  };

  return {
    ...p,
    cash: p.cash - biz.downPayment + oneTimePayout,
    fastTrack: {
      ...p.fastTrack,
      holdings: [...p.fastTrack.holdings, holding],
      cashflowDeltaSinceStart: p.fastTrack.cashflowDeltaSinceStart + recurring,
    },
    history: withEvent(p, {
      kind: "fastTrackBuy",
      ts: Date.now(),
      businessId,
      oneTimePayout: isOneTime ? biz.amount : undefined,
    }),
  };
}

export function sellBusiness(
  p: PlayerState,
  assetId: string,
  salePrice: number,
): PlayerState {
  const asset = p.businesses.find((b) => b.id === assetId);
  if (!asset) return p;
  const proceeds = salePrice - asset.liability;
  return {
    ...p,
    cash: p.cash + proceeds,
    businesses: p.businesses.filter((b) => b.id !== assetId),
    history: withEvent(p, {
      kind: "sellBusiness",
      ts: Date.now(),
      assetId,
      salePrice,
    }),
  };
}
