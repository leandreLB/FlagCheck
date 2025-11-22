import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY as string;

if (!SUPABASE_URL) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL manquant dans l'environnement");
}

if (!SUPABASE_SERVICE_KEY) {
    throw new Error("SUPABASE_SERVICE_KEY manquant dans l'environnement");
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: {
        autoRefreshToken: false,
        persistSession: false,
    },
});







