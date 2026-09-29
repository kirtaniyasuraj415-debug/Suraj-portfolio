"use client";

import { useLayoutEffect, useState } from "react";

export default function CinematicIntro() {
  const [stage, setStage] = useState<"peek" | "hold" | "exit" | "done">("peek");

  useLayoutEffect(() => {
    const root = document.documentElement;
    const introKey = "surajweb:intro-seen";
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const alreadySeen = window.sessionStorage.getItem(introKey) === "1";

    if (reduceMotion || alreadySeen) {
      root.classList.remove("cinematic-intro-active", "cinematic-intro-exit");
      root.classList.add("cinematic-intro-done");
      setStage("done");
      return;
    }

    window.sessionStorage.setItem(introKey, "1");
    const hold = window.setTimeout(() => {
      root.classList.add("cinematic-intro-active");
      setStage("hold");
    }, 360);

    const exit = window.setTimeout(() => {
      root.classList.add("cinematic-intro-exit");
      setStage("exit");
    }, 1960);

    const done = window.setTimeout(() => {
      root.classList.remove("cinematic-intro-active", "cinematic-intro-exit");
      root.classList.add("cinematic-intro-done");
      setStage("done");
    }, 2700);

    return () => {
      window.clearTimeout(hold);
      window.clearTimeout(exit);
      window.clearTimeout(done);
      root.classList.remove("cinematic-intro-active", "cinematic-intro-exit");
    };
  }, []);

  if (stage === "done") return null;

  return (
    <div className={`cinematic-intro cinematic-intro-${stage}`} aria-hidden="true">
      <div className="cinematic-intro-glow" />
      <div className="cinematic-intro-mark">
        <span>✦</span>
      </div>
    </div>
  );
}
