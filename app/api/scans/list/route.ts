import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabase } from "@/lib/supabase";
import { ScanRecord } from "@/lib/types";

export const runtime = "nodejs";

export async function GET() {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { data, error } = await supabase
            .from("scans")
            .select("*")
            .eq("user_id", userId)
            .order("created_at", { ascending: false })
            .returns<ScanRecord[]>();

        if (error) {
            return NextResponse.json(
                { error: "Failed to read scans", details: error.message },
                { status: 500 }
            );
        }

        return NextResponse.json(data ?? [], { status: 200 });
    } catch (err) {
        const message = err instanceof Error ? err.message : "Server error";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}










