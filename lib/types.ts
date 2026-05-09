// Конфигурационные типы (выведены из Zod-схем) переэкспортируются для удобства
export type {
  Profession,
  StockTemplate,
  DealTemplate,
  FastTrackBusiness,
  Rules,
} from "./schema";

// ───────── Состояние игрока во время партии ─────────

export type GamePhase = "ratRace" | "fastTrack";

/** Ключи статичных пассивов из карточки профессии (которые можно «закрыть» досрочно). */
export type ProfessionLiabilityKey =
  | "mortgage"
  | "schoolLoan"
  | "carLoan"
  | "creditCards"
  | "otherLoans";

export type OwnedStock = {
  id: string;
  templateId: string;   // ссылка на StockTemplate.id
  shares: number;
  buyPrice: number;     // средняя цена покупки за акцию
};

export type OwnedRealEstate = {
  id: string;
  name: string;
  deck: "small" | "big";
  templateId?: string;  // если выбрано из каталога — id шаблона; иначе freeform
  price: number;
  downPayment: number;
  mortgage: number;     // = price - downPayment
  monthlyCashflow: number;
};

export type OwnedBusiness = {
  id: string;
  name: string;
  templateId?: string;
  price: number;
  downPayment: number;
  liability: number;
  monthlyCashflow: number;
};

export type FastTrackHolding = {
  id: string;
  businessId: string;     // ref на FastTrackBusiness.id
  monthlyCashflow: number;
};

export type GameEvent =
  | { kind: "buyStock";        ts: number; templateId: string; shares: number; pricePerShare: number }
  | { kind: "sellStock";       ts: number; templateId: string; shares: number; pricePerShare: number }
  | { kind: "buyRealEstate";   ts: number; assetId: string }
  | { kind: "sellRealEstate";  ts: number; assetId: string; salePrice: number }
  | { kind: "buyBusiness";     ts: number; assetId: string }
  | { kind: "sellBusiness";    ts: number; assetId: string; salePrice: number }
  | { kind: "addChild";        ts: number }
  | { kind: "takeBankLoan";    ts: number; amount: number }
  | { kind: "repayBankLoan";   ts: number; amount: number }
  | { kind: "payOffLiability"; ts: number; key: ProfessionLiabilityKey; amount: number }
  | { kind: "doodad";          ts: number; description: string; amount: number }
  | { kind: "payday";          ts: number; cashflow: number }
  | { kind: "downsize";        ts: number }
  | { kind: "exitRatRace";     ts: number; passiveIncome: number }
  | { kind: "fastTrackBuy";    ts: number; businessId: string; oneTimePayout?: number };

export type FastTrackState = {
  initialPassiveIncome: number;            // = round_to_1000(пассивный) × 100
  holdings: FastTrackHolding[];
  cashflowDeltaSinceStart: number;         // сумма прибавок от ВТ-бизнесов (для условия +$50k)
  dreamBought: boolean;
};

export type PlayerState = {
  schemaVersion: 1;
  professionId: string;
  playerName: string;
  phase: GamePhase;
  childrenCount: number;
  cash: number;                            // текущие сбережения

  stocks: OwnedStock[];
  realEstate: OwnedRealEstate[];
  businesses: OwnedBusiness[];
  bankLoanAmount: number;                  // тело банк. кредита (кратно rules.bankLoan.step)

  /** Какие статичные пассивы профессии уже погашены (полностью). */
  paidOffLiabilities?: ProfessionLiabilityKey[];

  fastTrack?: FastTrackState;
  history: GameEvent[];
};

// ───────── Слот сохранения (до 4 на устройство) ─────────

export type ProfileSlot = {
  id: string;            // uuid
  createdAt: number;
  updatedAt: number;
  player: PlayerState;
};

export type StorageState = {
  schemaVersion: 1;
  profiles: ProfileSlot[];   // длина 0..rules.maxProfileSlots
  activeId: string | null;
};
