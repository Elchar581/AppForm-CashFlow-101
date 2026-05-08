import { RULES } from "./configs";
import type {
  GameEvent,
  OwnedBusiness,
  OwnedRealEstate,
  OwnedStock,
  PlayerState,
} from "./types";

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
  const step = RULES.bankLoan.step;
  if (amount <= 0 || amount % step !== 0) return p;
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
