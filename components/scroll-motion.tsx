"use client";

import { useEffect } from "react";

export default function ScrollMotion() {
  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) return;

    const sections = Array.from(
      document.querySelectorAll<HTMLElement>(
        "main > section:not(.hero), .technology-row, .projects-heading, .project-card, .service-row, .process-grid article, #feedback article, #feedback form, details"
      )
    );

    sections.forEach((element, index) => {
      element.classList.add("scroll-reveal");
      element.style.setProperty("--reveal-index", String(index % 5));
    });

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            (entry.target as HTMLElement).classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.12,
        rootMargin: "0px 0px -8% 0px",
      }
    );

    sections.forEach((element) => observer.observe(element));

    const hero = document.querySelector<HTMLElement>(".hero");
    hero?.classList.add("hero-motion-ready");
    requestAnimationFrame(() => hero?.classList.add("hero-motion-visible"));

    return () => observer.disconnect();
  }, []);

  return null;
}
