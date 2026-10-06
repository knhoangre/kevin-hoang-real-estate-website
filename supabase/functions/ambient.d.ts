/**
 * Ambient types for Supabase Edge Functions (Deno) so editors that use the
 * workspace TypeScript server understand `Deno`, URL imports, and `npm:` specifiers.
 */

declare const Deno: {
  env: { get(key: string): string | undefined };
};

declare module "https://deno.land/std@0.168.0/http/server.ts" {
  export function serve(
    handler: (request: Request) => Response | Promise<Response>,
  ): void;
}

declare module "npm:resend@3.1.0" {
  export class Resend {
    constructor(apiKey: string);
    emails: {
      send(
        payload: Record<string, unknown>,
      ): Promise<{ data?: unknown; error?: unknown }>;
    };
  }
}

/** Matches runtime import; typed as `any` so table names without generated DB types do not become `never`. */
declare module "https://esm.sh/@supabase/supabase-js@2.38.4" {
  export function createClient(
    supabaseUrl: string,
    supabaseKey: string,
    options?: Record<string, unknown>,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- see the note above
  ): any;
}

/**
 * postgres.js, for the CockroachDB side of the sold feed. Loosely typed for the
 * same reason the Supabase client is: the runtime resolves the URL import, and
 * a workspace TypeScript server cannot.
 */
declare module "https://deno.land/x/postgresjs@v3.4.4/mod.js" {
  // deno-lint-ignore no-explicit-any
  type Row = Record<string, any>;
  interface Sql {
    <T extends readonly Row[] = Row[]>(strings: TemplateStringsArray, ...values: unknown[]): Promise<T>;
    // A list for IN (…), or rows + column names for INSERT … VALUES.
    (values: readonly unknown[] | readonly Row[], ...columns: string[]): unknown;
    unsafe(query: string): unknown;
    array(values: readonly unknown[]): unknown;
    end(options?: { timeout?: number }): Promise<void>;
  }
  export default function postgres(url: string, options?: Record<string, unknown>): Sql;
}
