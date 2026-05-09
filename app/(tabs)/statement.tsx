import { router } from "expo-router";
import React, { useEffect } from "react";

import { FastTrackView } from "@/components/fast-track-view";
import { RatRaceView } from "@/components/rat-race-view";
import { useActiveProfile } from "@/store/profiles";

export default function StatementScreen() {
  const slot = useActiveProfile();

  useEffect(() => {
    if (!slot) router.replace("/profiles");
  }, [slot]);

  if (!slot) return null;
  if (slot.player.phase === "fastTrack") {
    return <FastTrackView player={slot.player} />;
  }
  return <RatRaceView player={slot.player} />;
}
