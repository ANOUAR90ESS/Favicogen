/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

declare module '*.md?raw' {
  const content: string;
  export default content;
}

/**
 * The build-time settings this app reads.
 *
 * Declared rather than left to `vite/client`'s permissive `any`, so a typo in
 * a variable name is a compile error instead of an undefined that silently
 * turns the account layer off in production.
 *
 * `VITE_` is the only prefix Vite inlines into the browser bundle, which makes
 * the prefix itself the rule: nothing secret may ever be named this way. The
 * Supabase anon key is publishable by design — row-level security, not
 * secrecy, is what guards the data — while the service-role key belongs to the
 * server alone and must never appear here.
 */
interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
