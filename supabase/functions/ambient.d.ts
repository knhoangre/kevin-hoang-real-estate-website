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
  ): any;
}
