import { Stack, router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  TouchableOpacity,
  View
} from "react-native";

import { FormScroll } from "@/components/form-scroll";

import { ThemedInput } from "@/components/themed-input";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { BIG_DEALS, SMALL_DEALS } from "@/lib/configs";
import { buyRealEstate } from "@/lib/events";
import { useT } from "@/store/locale";
import { alertModal } from "@/store/alert";
import { useActiveProfile, useProfilesActions } from "@/store/profiles";

const fmt = (n: number) =>
  (n < 0 ? "-" : "") + "$" + Math.abs(n).toLocaleString("ru-RU");

export default function BuyRealEstateScreen() {
  const t = useT();
  const slot = useActiveProfile();
  const { updatePlayer } = useProfilesActions();
  const [deck, setDeck] = useState<"small" | "big">("small");
  const [name, setName] = useState("");
  const [templateId, setTemplateId] = useState<string | undefined>(undefined);
  const [price, setPrice] = useState("");
  const [downPayment, setDownPayment] = useState("");
  const [cashflow, setCashflow] = useState("");

  useEffect(() => {
    if (!slot) router.replace("/profiles");
  }, [slot]);

  if (!slot) return null;

  const catalog = deck === "small" ? SMALL_DEALS : BIG_DEALS;
  const priceN = parseFloat(price.replace(",", "."));
  const dpN = parseFloat(downPayment.replace(",", "."));
  const cfN = parseFloat(cashflow.replace(",", "."));
  const mortgage =
    Number.isFinite(priceN) && Number.isFinite(dpN) ? priceN - dpN : 0;

  const pickFromCatalog = (id: string, label: string) => {
    setTemplateId(id);
    setName(label);
  };

  const onSubmit = () => {
    if (!Number.isFinite(priceN) || priceN <= 0) {
      alertModal(t("common.error"), "");
      return;
    }
    if (!Number.isFinite(dpN) || dpN < 0 || dpN > priceN) {
      alertModal(t("common.error"), "");
      return;
    }
    if (dpN > slot.player.cash) {
      alertModal(t("forms.notEnough"), t("forms.notEnoughText", { amount: fmt(dpN), cash: fmt(slot.player.cash) }));
      return;
    }
    if (!Number.isFinite(cfN)) {
      alertModal(t("common.error"), "");
      return;
    }
    updatePlayer(slot.id, (s) =>
      buyRealEstate(s, {
        name,
        deck,
        templateId,
        price: priceN,
        downPayment: dpN,
        monthlyCashflow: cfN,
      }),
    );
    router.back();
  };

  return (
    <>
      <Stack.Screen options={{ title: t("actions.buyRealEstate") }} />
      <FormScroll>
      <ThemedView style={styles.card}>
        <ThemedText type="subtitle">{t("buyRE.dealType")}</ThemedText>
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, deck === "small" && styles.tabActive]}
            onPress={() => {
              setDeck("small");
              setTemplateId(undefined);
              setName("");
            }}
          >
            <ThemedText
              type={deck === "small" ? "defaultSemiBold" : "default"}
            >
              {t("buyRE.small")}
            </ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, deck === "big" && styles.tabActive]}
            onPress={() => {
              setDeck("big");
              setTemplateId(undefined);
              setName("");
            }}
          >
            <ThemedText type={deck === "big" ? "defaultSemiBold" : "default"}>
              Крупная
            </ThemedText>
          </TouchableOpacity>
        </View>
        <ThemedText style={styles.muted}>
          {t("buyRE.pickFromCatalog")}
        </ThemedText>
        <View style={styles.chips}>
          {catalog.map((d) => {
            const dealName = t(
              `${deck === "small" ? "smallDeals" : "bigDeals"}.${d.id}`,
              { defaultValue: d.name },
            );
            return (
              <TouchableOpacity
                key={d.id}
                style={[
                  styles.chip,
                  templateId === d.id && styles.chipActive,
                ]}
                onPress={() => pickFromCatalog(d.id, dealName)}
              >
                <ThemedText
                  type={templateId === d.id ? "defaultSemiBold" : "default"}
                >
                  {dealName}
                </ThemedText>
              </TouchableOpacity>
            );
          })}
        </View>
      </ThemedView>

      <ThemedView style={styles.card}>
        <ThemedText type="defaultSemiBold">{t("forms.name")}</ThemedText>
        <ThemedInput
          placeholder={t("buyRE.placeholderName")}
          value={name}
          onChangeText={(v) => {
            setName(v);
            setTemplateId(undefined);
          }}
        />

        <ThemedText type="defaultSemiBold" style={{ marginTop: 8 }}>
          {t("forms.price")}
        </ThemedText>
        <ThemedInput
          keyboardType="numeric"
          placeholder={t("forms.priceFromCard")}
          value={price}
          onChangeText={setPrice}
        />

        <ThemedText type="defaultSemiBold" style={{ marginTop: 8 }}>
          {t("forms.downPayment")}
        </ThemedText>
        <ThemedInput
          keyboardType="numeric"
          placeholder={t("forms.downPaymentSub")}
          value={downPayment}
          onChangeText={setDownPayment}
        />

        <ThemedText type="defaultSemiBold" style={{ marginTop: 8 }}>
          {t("forms.monthlyCashflow")}
        </ThemedText>
        <ThemedInput
          keyboardType="numeric"
          placeholder={t("forms.priceFromCard")}
          value={cashflow}
          onChangeText={setCashflow}
        />

        <View style={styles.row}>
          <ThemedText style={styles.muted}>{t("forms.mortgageMinusDp")}</ThemedText>
          <ThemedText type="defaultSemiBold">
            {fmt(Math.max(0, mortgage))}
          </ThemedText>
        </View>
        <View style={styles.row}>
          <ThemedText style={styles.muted}>{t("forms.savingsAfter")}</ThemedText>
          <ThemedText
            type="defaultSemiBold"
            style={{
              color:
                Number.isFinite(dpN) && slot.player.cash - dpN < 0
                  ? "#c62828"
                  : undefined,
            }}
          >
            {fmt(slot.player.cash - (Number.isFinite(dpN) ? dpN : 0))}
          </ThemedText>
        </View>
      </ThemedView>

      <TouchableOpacity style={styles.submitBtn} onPress={onSubmit}>
        <ThemedText type="defaultSemiBold" style={styles.submitText}>
          {t("forms.btnBuy")}
        </ThemedText>
      </TouchableOpacity>
    </FormScroll>
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(127,127,127,0.4)",
    gap: 8,
  },
  tabs: { flexDirection: "row", gap: 8 },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(127,127,127,0.5)",
  },
  tabActive: {
    borderColor: "#2e7d32",
    backgroundColor: "rgba(46,125,50,0.1)",
  },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 4 },
  chip: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(127,127,127,0.4)",
  },
  chipActive: {
    borderColor: "#2e7d32",
    backgroundColor: "rgba(46,125,50,0.1)",
  },
  row: { flexDirection: "row", justifyContent: "space-between", marginTop: 4 },
  submitBtn: {
    backgroundColor: "#2e7d32",
    padding: 16,
    borderRadius: 10,
    alignItems: "center",
  },
  submitText: { color: "#fff" },
  muted: { opacity: 0.6 },
});
