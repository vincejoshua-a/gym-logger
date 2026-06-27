/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Apps Script web app URL (…/exec). Set in .env.local and CI. */
  readonly VITE_SHEET_ENDPOINT?: string;
  /** Secret token that must match the Apps Script SECRET. */
  readonly VITE_SHEET_TOKEN?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
