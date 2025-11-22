import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabase } from "@/lib/supabase";
import { ScanRecord } from "@/lib/types";

export const runtime = "nodejs";

export async function GET(
  request: Request,
  context: { params: Promise<{ scanId: string }> }
) {
  console.log("🔍 API /api/scans/[scanId] appelée");
  
  try {
    const { userId } = await auth();
    console.log("👤 userId:", userId);
    
    if (!userId) {
      console.log("❌ Pas d'utilisateur connecté");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ✅ AWAIT params (Next.js 15+)
    const { scanId } = await context.params;
    console.log("📄 scanId demandé:", scanId);

    const { data, error } = await supabase
      .from("scans")
      .select("*")
      .eq("id", scanId)
      .eq("user_id", userId)
      .single<ScanRecord>();

    console.log("📊 Résultat Supabase - data:", data ? "✅ Trouvé" : "❌ Vide");
    console.log("📊 Résultat Supabase - error:", error);

    if (error || !data) {
      console.log("❌ Scan non trouvé en base");
      return NextResponse.json(
        { error: "Scan non trouvé" },
        { status: 404 }
      );
    }

    console.log("✅ Scan trouvé, renvoi des données");
    return NextResponse.json(data, { status: 200 });
  } catch (err) {
    console.error("💥 Global error:", err);
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}








