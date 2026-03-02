"use client";

import FireworksScene from "./components/FireworksScene";

export default function Home() {
  return (
    <FireworksScene
      launchInterval={3.3}
      launchIntervalJitter={0.5}
      launchCooldown={1.4}
      launchCooldownJitter={1.2}
      maxDelta={0.005}
      rocketGravity={0.2}
      particleGravity={1.2}
      particleDrag={0.4}
      particleSize={0.35}
      particleCount={1000}
      particleCountJitter={200}
      burstDecayStart={120}
      burstDecayDuration={360}
      starCount={1000}
    />
  );
}
