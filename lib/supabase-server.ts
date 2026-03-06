import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  // On évite de throw au chargement en production pour ne pas casser tout Next,
  // mais les fonctions qui utilisent ce client vérifieront la présence des envs.
  console.warn(
    "[supabase-server] SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY manquant. " +
      "Vérifiez votre configuration d’environnement."
  );
}

export const supabaseAdmin = SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        persistSession: false,
      },
    })
  : null;

