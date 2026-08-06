"use client";
import { useEffect } from "react";

export function ServiceWorkerUpdater() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    // A brand-new visitor has no controller yet, and `clientsClaim()` firing
    // the *first* claim also emits `controllerchange` — without this guard
    // every first-time visit reloads itself once, which isn't what this is
    // for. Only reload when control moves from one worker to another.
    const hadController = !!navigator.serviceWorker.controller;
    let reloaded = false;
    const onControllerChange = () => {
      if (!hadController || reloaded) return;
      reloaded = true;
      window.location.reload();
    };
    navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);
    return () => navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
  }, []);
  return null;
}
