// SPIKE 0.8 — PWA/Serwist (temporário; decisão em docs/aaa-reviews/07-spike-pwa.md)
import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry } from "serwist";
import { Serwist } from "serwist";

const serwist = new Serwist({
  // `self.__SW_MANIFEST` é o ponto de injeção do Serwist (precache manifest)
  precacheEntries: (self as unknown as { __SW_MANIFEST?: (PrecacheEntry | string)[] }).__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: defaultCache,
});

serwist.addEventListeners();
