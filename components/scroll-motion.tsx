"use client";

import { useEffect } from "react";

const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value));
const ease = (value: number) => {
  const t = clamp(value);
  return 1 - Math.pow(1 - t, 3);
};

type MotionItem = {
  el: HTMLElement;
  index: number;
  direction: "left" | "right" | "up" | "scale";
};

export default function ScrollMotion() {
  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const raw: Array<{ selector: string; direction: MotionItem["direction"] }> = [
      { selector: ".skills-marquee", direction: "up" },
      { selector: ".about-label", direction: "left" },
      { selector: ".about-copy", direction: "right" },
      { selector: ".technology-row > span", direction: "up" },
      { selector: ".projects-heading", direction: "right" },
      { selector: ".project-card", direction: "scale" },
      { selector: "[aria-labelledby='why-heading'] .section-heading", direction: "up" },
      { selector: ".why-card", direction: "up" },
      { selector: ".services-section .section-heading", direction: "up" },
      { selector: ".service-row", direction: "up" },
      { selector: ".process-section > .section-label", direction: "left" },
      { selector: ".process-section > h2", direction: "up" },
      { selector: ".process-grid article", direction: "up" },
      { selector: ".process-section > .mt-12", direction: "up" },
      { selector: "#feedback > div > div:first-child", direction: "left" },
      { selector: "#feedback article", direction: "right" },
      { selector: "#feedback form", direction: "up" },
      { selector: "details", direction: "up" },
      { selector: ".contact-section .section-label", direction: "left" },
      { selector: ".contact-main h2", direction: "left" },
      { selector: ".contact-arrow", direction: "scale" },
      { selector: ".contact-bottom", direction: "up" },
      { selector: ".site-footer > *", direction: "up" },
    ];

    const items: MotionItem[] = [];
    let counter = 0;
    for (const group of raw) {
      document.querySelectorAll<HTMLElement>(group.selector).forEach((el) => {
        if (el.dataset.cinematicMotion === "true") return;
        el.dataset.cinematicMotion = "true";
        el.classList.add("cinematic-scroll-item");
        const direction =
          group.selector === ".project-card"
            ? (counter % 2 === 0 ? "left" : "right")
            : group.direction;
        items.push({ el, index: counter++, direction });
      });
    }

    const projectVisuals = Array.from(document.querySelectorAll<HTMLElement>(".project-visual"));
    projectVisuals.forEach((el) => el.classList.add("cinematic-project-visual"));

    const hero = document.querySelector<HTMLElement>(".hero");
    let frame = 0;
    let ticking = false;

    const render = () => {
      ticking = false;
      const vh = window.innerHeight || 1;

      if (hero && !reduceMotion) {
        const rect = hero.getBoundingClientRect();
        const heroProgress = clamp(-rect.top / Math.max(rect.height * 0.92, 1));
        hero.style.setProperty("--hero-scroll", heroProgress.toFixed(4));
        hero.style.setProperty("--hero-name-y", `${(-heroProgress * 118).toFixed(2)}px`);
        hero.style.setProperty("--hero-name-scale", (1 - heroProgress * 0.055).toFixed(4));
        hero.style.setProperty("--hero-name-opacity", (1 - heroProgress * 0.82).toFixed(4));
        hero.style.setProperty("--hero-portrait-y", `${(-heroProgress * 86).toFixed(2)}px`);
        hero.style.setProperty("--hero-portrait-scale", (1 - heroProgress * 0.19).toFixed(4));
        hero.style.setProperty("--hero-intro-y", `${(-heroProgress * 46).toFixed(2)}px`);
        hero.style.setProperty("--hero-intro-opacity", (1 - heroProgress * 1.05).toFixed(4));
        hero.style.setProperty("--hero-card-y", `${(-heroProgress * 72).toFixed(2)}px`);
        hero.style.setProperty("--hero-card-scale", (1 - heroProgress * 0.12).toFixed(4));
        hero.style.setProperty("--hero-card-opacity", (1 - heroProgress * 0.92).toFixed(4));
        hero.style.setProperty("--hero-atmosphere-y", `${(heroProgress * 34).toFixed(2)}px`);
      }

      items.forEach(({ el, index, direction }) => {
        if (reduceMotion) {
          el.style.setProperty("--motion-opacity", "1");
          el.style.setProperty("--motion-x", "0px");
          el.style.setProperty("--motion-y", "0px");
          el.style.setProperty("--motion-scale", "1");
          el.style.setProperty("--motion-blur", "0px");
          return;
        }

        const rect = el.getBoundingClientRect();
        const rawProgress = (vh * 0.94 - rect.top) / Math.max(vh * 0.68 + rect.height * 0.45, 1);
        const stagger = Math.min((index % 4) * 0.045, 0.135);
        const progress = ease(clamp((rawProgress - stagger) / (1 - stagger)));

        let x = 0;
        let y = (1 - progress) * 44;
        let scale = 0.973 + progress * 0.027;

        if (direction === "left") x = -(1 - progress) * 72;
        if (direction === "right") x = (1 - progress) * 72;
        if (direction === "scale") {
          y = (1 - progress) * 64;
          scale = 0.925 + progress * 0.075;
        }

        const center = rect.top + rect.height / 2;
        const centerOffset = clamp((center - vh / 2) / vh, -1, 1);
        const parallax = -centerOffset * 12 * progress;

        el.style.setProperty("--motion-opacity", progress.toFixed(4));
        el.style.setProperty("--motion-x", `${x.toFixed(2)}px`);
        el.style.setProperty("--motion-y", `${(y + parallax).toFixed(2)}px`);
        el.style.setProperty("--motion-scale", scale.toFixed(4));
        el.style.setProperty("--motion-blur", `${((1 - progress) * 2.4).toFixed(2)}px`);

        if (el.classList.contains("project-card")) {
          el.style.setProperty("--project-progress", progress.toFixed(4));
        }
      });

      projectVisuals.forEach((visual) => {
        if (reduceMotion) {
          visual.style.setProperty("--visual-shift", "0px");
          visual.style.setProperty("--visual-word-shift", "0px");
          visual.style.setProperty("--visual-scale", "1");
          return;
        }
        const rect = visual.getBoundingClientRect();
        const center = rect.top + rect.height / 2;
        const normalized = clamp((center - vh / 2) / vh, -1, 1);
        const visualShift = -normalized * 24;
        visual.style.setProperty("--visual-shift", `${visualShift.toFixed(2)}px`);
        visual.style.setProperty("--visual-word-shift", `${(-visualShift * 0.25).toFixed(2)}px`);
        visual.style.setProperty("--visual-scale", (1.045 - Math.abs(normalized) * 0.025).toFixed(4));
      });
    };

    const requestRender = () => {
      if (ticking) return;
      ticking = true;
      frame = window.requestAnimationFrame(render);
    };

    render();
    window.addEventListener("scroll", requestRender, { passive: true });
    window.addEventListener("resize", requestRender);

    return () => {
      window.removeEventListener("scroll", requestRender);
      window.removeEventListener("resize", requestRender);
      window.cancelAnimationFrame(frame);
      items.forEach(({ el }) => {
        delete el.dataset.cinematicMotion;
        el.classList.remove("cinematic-scroll-item");
      });
      projectVisuals.forEach((el) => el.classList.remove("cinematic-project-visual"));
    };
  }, []);

  return null;
}
