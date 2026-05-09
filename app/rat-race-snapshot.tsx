import { Stack, router } from "expo-router";
import React, { useEffect } from "react";

import { RatRaceView } from "@/components/rat-race-view";
import { useT } from "@/store/locale";
import { useActiveProfile } from "@/store/profiles";

export default function RatRaceSnapshotScreen() {
  const t = useT();
  const slot = useActiveProfile();

  useEffect(() => {
    if (!slot) router.replace("/profiles");
  }, [slot]);

  if (!slot) return null;
  return (
    <>
      <Stack.Screen options={{ title: t("phase.snapshot") }} />
      <RatRaceView player={slot.player} snapshot />
    </>
  );
}
