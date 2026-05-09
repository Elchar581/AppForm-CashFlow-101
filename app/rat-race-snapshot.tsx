import { router } from "expo-router";
import React, { useEffect } from "react";

import { RatRaceView } from "@/components/rat-race-view";
import { useActiveProfile } from "@/store/profiles";

export default function RatRaceSnapshotScreen() {
  const slot = useActiveProfile();

  useEffect(() => {
    if (!slot) router.replace("/");
  }, [slot]);

  if (!slot) return null;
  return <RatRaceView player={slot.player} snapshot />;
}
