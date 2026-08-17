"use client";

import { useRef } from "react";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import { SplitText } from "gsap/SplitText";

gsap.registerPlugin(useGSAP, SplitText);

/**
 * Anima a entrada de uma tela:
 *  - header (.page-header / .site-header) desliza de cima + fade
 *  - [data-anim="title"]  -> SplitText: letras revelam de baixo p/ cima (máscara) com stagger
 *  - [data-anim="stagger"] -> itens entram em cascata (lista, cards, abas)
 *  - [data-anim="fade"]    -> fade/slide suave
 * Respeita prefers-reduced-motion (pula animações, deixa tudo visível).
 */
export function useScreenAnimation(deps = []) {
  const scope = useRef(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add(
        {
          reduce: "(prefers-reduced-motion: reduce)",
          motion: "(prefers-reduced-motion: no-preference)",
        },
        (ctx) => {
          const { reduce } = ctx.conditions;

          const reveal = "[data-anim='title']";

          if (reduce) {
            gsap.set(
              [
                ".page-header, .site-header",
                reveal,
                "[data-anim='stagger']",
                "[data-anim='fade']",
              ].join(","),
              { clearProps: "all", opacity: 1 }
            );
            return;
          }

          const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

          tl.from(
            ".page-header, .site-header",
            { y: -24, autoAlpha: 0, duration: 0.5 }
          );

          // Títulos: SplitText com máscara (reveal subindo)
          const titles = gsap.utils.toArray(reveal);
          titles.forEach((el) => {
            const split = SplitText.create(el, {
              type: "chars, words",
              mask: "chars",
              autoSplit: true,
              onSplit(self) {
                return gsap.from(self.chars, {
                  yPercent: 120,
                  rotate: 6,
                  autoAlpha: 0,
                  duration: 0.6,
                  ease: "back.out(1.7)",
                  stagger: 0.035,
                });
              },
            });
            // guarda para cleanup automático do useGSAP
            ctx.add(() => split.revert());
          });

          tl.from(
            "[data-anim='stagger']",
            { y: 22, autoAlpha: 0, duration: 0.5, stagger: 0.07 },
            "-=0.1"
          ).from(
            "[data-anim='fade']",
            { y: 14, autoAlpha: 0, duration: 0.45, stagger: 0.05 },
            "-=0.3"
          );
        },
        scope
      );

      return () => mm.revert();
    },
    { scope, dependencies: deps }
  );

  return scope;
}

export { gsap };
