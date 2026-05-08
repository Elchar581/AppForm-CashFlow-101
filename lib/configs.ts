import professionsJson from "@/config/professions.json";
import stocksJson from "@/config/stocks.json";
import smallDealsJson from "@/config/small-deals.json";
import bigDealsJson from "@/config/big-deals.json";
import fastTrackJson from "@/config/fast-track.json";
import rulesJson from "@/config/rules.json";

import {
  ProfessionListSchema,
  StockListSchema,
  DealListSchema,
  FastTrackListSchema,
  RulesSchema,
} from "./schema";

export const PROFESSIONS = ProfessionListSchema.parse(professionsJson);
export const STOCKS = StockListSchema.parse(stocksJson);
export const SMALL_DEALS = DealListSchema.parse(smallDealsJson);
export const BIG_DEALS = DealListSchema.parse(bigDealsJson);
export const FAST_TRACK = FastTrackListSchema.parse(fastTrackJson);
export const RULES = RulesSchema.parse(rulesJson);

export const PROFESSION_BY_ID = Object.fromEntries(
  PROFESSIONS.map((p) => [p.id, p]),
);
export const STOCK_BY_ID = Object.fromEntries(STOCKS.map((s) => [s.id, s]));
export const FAST_TRACK_BY_ID = Object.fromEntries(
  FAST_TRACK.map((b) => [b.id, b]),
);
