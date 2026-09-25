"use client";

import { useEffect } from "react";

const REVEAL_SELECTOR = "[data-reveal]";

export function MotionController() {
  useEffect(() => {
    const root = document.documentElement;
    const revealItems = Array.from(document.querySelectorAll<HTMLElement>(REVEAL_SELECTOR));
    const problemProgress = Array.from(document.querySelectorAll<HTMLElement>("[data-problem-progress]"));
    const countItems = Array.from(document.querySelectorAll<HTMLElement>("[data-count]"));
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;
    let cleanupProblemScroll = () => {};

    root.classList.add("motion-ready");

    const reveal = (element: HTMLElement) => {
      if (reduceMotion.matches) {
        element.classList.add("is-visible");
        return;
      }
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            element.classList.add("is-visible");
            observer.disconnect();
          }
        },
        { threshold: 0.16, rootMargin: "0px 0px -8% 0px" },
      );
      observer.observe(element);
    };
    revealItems.forEach(reveal);

    const problemChapters = Array.from(document.querySelectorAll<HTMLElement>("[data-problem-chapter]"));
    const problemVisuals = Array.from(document.querySelectorAll<HTMLElement>("[data-problem-visual]"));
    const stageCaption = document.querySelector<HTMLElement>("[data-stage-caption]");
    const captions = ["01 · Ownership", "02 · Market", "03 · Settlement"];
    const activateProblemChapter = (index: number) => {
      problemChapters.forEach((chapter, chapterIndex) => chapter.classList.toggle("is-active", chapterIndex === index));
      problemVisuals.forEach((visual, visualIndex) => visual.toggleAttribute("data-problem-active", visualIndex === index));
      problemProgress.forEach((step, stepIndex) => step.toggleAttribute("data-problem-active", stepIndex === index));
      if (stageCaption) stageCaption.textContent = captions[index] ?? captions[0];
    };
    activateProblemChapter(0);

    if (problemChapters.length > 0) {
      if (reduceMotion.matches) {
        problemChapters.forEach((chapter) => chapter.classList.add("is-visible"));
      }
      let problemFrame = 0;
      const updateProblemChapter = () => {
        problemFrame = 0;
        const viewportAnchor = window.innerHeight * 0.48;
        let closestIndex = 0;
        let closestDistance = Number.POSITIVE_INFINITY;
        problemChapters.forEach((chapter, index) => {
          const rect = chapter.getBoundingClientRect();
          const distance = Math.abs(rect.top + rect.height / 2 - viewportAnchor);
          if (distance < closestDistance) {
            closestDistance = distance;
            closestIndex = index;
          }
        });
        activateProblemChapter(closestIndex);
      };
      const onProblemScroll = () => {
        if (!problemFrame) problemFrame = requestAnimationFrame(updateProblemChapter);
      };
      updateProblemChapter();
      window.addEventListener("scroll", onProblemScroll, { passive: true });
      window.addEventListener("resize", onProblemScroll);
      cleanupProblemScroll = () => {
        cancelAnimationFrame(problemFrame);
        window.removeEventListener("scroll", onProblemScroll);
        window.removeEventListener("resize", onProblemScroll);
      };
    }

    const animateCount = (element: HTMLElement) => {
      const target = Number(element.dataset.count ?? "0");
      const suffix = element.dataset.suffix ?? "";
      const prefix = element.dataset.prefix ?? "";
      const format = element.dataset.format ?? "number";
      if (reduceMotion.matches) {
        element.textContent = `${prefix}${format === "time" ? "24/7" : target}${suffix}`;
        return;
      }
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (!entry.isIntersecting) return;
          observer.disconnect();
          const startedAt = performance.now();
          const duration = 1800;
          const tick = (now: number) => {
            const progress = Math.min((now - startedAt) / duration, 1);
            const eased = 1 - (1 - progress) ** 3;
            element.textContent = `${prefix}${Math.round(target * eased)}${suffix}`;
            if (progress < 1) frame = requestAnimationFrame(tick);
          };
          frame = requestAnimationFrame(tick);
        },
        { threshold: 0.45 },
      );
      observer.observe(element);
    };
    countItems.forEach(animateCount);

    const updateParallax = () => {
      const offset = Math.min(window.scrollY * 0.08, 42);
      root.style.setProperty("--background-drift", `${offset}px`);
    };
    updateParallax();
    window.addEventListener("scroll", updateParallax, { passive: true });

    return () => {
      root.classList.remove("motion-ready");
      root.style.removeProperty("--background-drift");
      window.removeEventListener("scroll", updateParallax);
      cleanupProblemScroll();
      cancelAnimationFrame(frame);
    };
  }, []);

  return null;
}
