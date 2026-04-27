"use client";

import { useEffect } from "react";

function scrollToId(id: string) {
  if (!id) return;
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
}

/** เลื่อนไปยัง #id หลังโหลดหน้า (รองรับ client navigation ของ Next.js) */
export default function ScrollToHash() {
  useEffect(() => {
    const getId = () => window.location.hash.replace(/^#/, "");

    const run = () => {
      const id = getId();
      if (!id) return;
      requestAnimationFrame(() => {
        requestAnimationFrame(() => scrollToId(id));
      });
    };

    run();
    const onHashChange = () => run();
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  return null;
}
