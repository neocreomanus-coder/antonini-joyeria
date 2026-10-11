// Keep legacy checkout operational until existing stock counts are audited.
// This flag is baked in at build time; enable only after testing checkout and backend together.
export const INVENTORY_ENFORCED = import.meta.env.VITE_INVENTORY_ENFORCEMENT === "true";
