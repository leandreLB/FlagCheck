import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabase } from "@/lib/supabase";
import { RedFlag, ScanRecord } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(request: Request) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const contentType = request.headers.get("content-type") || "";
        if (!contentType.includes("multipart/form-data")) {
            return NextResponse.json(
                { error: "Requête invalide: utilisez multipart/form-data" },
                { status: 400 }
            );
        }

        const formData = await request.formData();
        const file = formData.get("image");
        const redFlagsRaw = formData.get("red_flags");
        const scoreRaw = formData.get("score");

        if (!(file instanceof File)) {
            return NextResponse.json({ error: "Image file missing" }, { status: 400 });
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        const fileExt =
            file.type === "image/png"
                ? "png"
                : file.type === "image/webp"
                ? "webp"
                : file.type === "image/gif"
                ? "gif"
                : "jpg";
        const fileName = `${crypto.randomUUID()}.${fileExt}`;
        const filePath = `${userId}/${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from("scan-images")
            .upload(filePath, buffer, {
                contentType: file.type || "image/jpeg",
                upsert: false,
            });

        if (uploadError) {
            return NextResponse.json(
                { error: "Upload failed", details: uploadError.message },
                { status: 500 }
            );
        }

        const { data: publicUrlData } = supabase.storage.from("scan-images").getPublicUrl(filePath);
        const imageUrl = publicUrlData.publicUrl;

        let redFlags: RedFlag[] = [];
        if (typeof redFlagsRaw === "string" && redFlagsRaw.trim().length > 0) {
            try {
                const parsed = JSON.parse(redFlagsRaw);
                if (Array.isArray(parsed)) {
                    redFlags = parsed;
                }
            } catch {
                // ignore invalid JSON, keep empty array
            }
        }

        const score =
            typeof scoreRaw === "string" && !Number.isNaN(Number(scoreRaw))
                ? Math.max(0, Math.min(10, Number(scoreRaw)))
                : 0;

        const { data, error } = await supabase
            .from("scans")
            .insert({
                user_id: userId,
                image_url: imageUrl,
                red_flags: redFlags as unknown as object,
                score,
            })
            .select()
            .single<ScanRecord>();

        if (error) {
            return NextResponse.json(
                { error: "Database insertion failed", details: error.message },
                { status: 500 }
            );
        }

        return NextResponse.json(data, { status: 201 });
    } catch (err) {
        const message = err instanceof Error ? err.message : "Server error";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}








