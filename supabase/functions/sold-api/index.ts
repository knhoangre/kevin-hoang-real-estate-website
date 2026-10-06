/**
 * Read access to the kept sold data — the sold tab, sold listing pages and the
 * comparable sales behind the price estimate.
 *
 * Everything this endpoint does is in _shared/soldRead.ts, where the reasoning
 * is and where cockroach/tests can reach it. This file only puts it on a port.
 */
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { handleSoldRequest } from '../_shared/soldRead.ts';

serve(handleSoldRequest);
