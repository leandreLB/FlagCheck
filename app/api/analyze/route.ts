import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import OpenAI from "openai";
import { supabase } from "@/lib/supabase";
import { ScanRecord } from "@/lib/types";
import { getUserSubscription, hasProAccess, decrementFreeScans } from "@/lib/subscription";

export const runtime = "nodejs";

// ⚙️ FORCE MOCK MODE - Change to false when ready to use real OpenAI
const USE_MOCK_DATA = false;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "fake-key-for-mock",
});

const ANALYSIS_PROMPT = `You are a dating profile expert. Analyze this profile screenshot and identify RED FLAGS.

IMPORTANT SCORING GUIDELINES:
- 1-2/10: Healthy, legitimate profiles with NO red flags. This should be the DEFAULT for most normal profiles. Only give 1-2 if the profile is genuinely clean and shows no concerning patterns.
- 3-6/10: Moderate red flags - minor concerns like generic bios, some clichés, or harmless quirks. These are NOT serious issues.
- 7-10/10: SERIOUS red flags ONLY - scammers, narcissists, manipulators, dangerous behavior, or multiple major warning signs. Reserve these scores for genuinely problematic profiles.

Common red flags to look for:
- Only gym/mirror selfies (shows narcissism)
- Fish pictures (overdone cliché)
- Group photos only (can't identify the person)
- Sunglasses in every pic (hiding something)
- Empty or generic bio ("just ask", "love to travel")
- Trying too hard to be funny/edgy
- Too many party/drinking photos
- Obvious filters in every pic
- Shirtless pics (unless at beach/pool context)

CRITICAL: Most profiles should score 1-2/10. Only use higher scores for REAL problems. Be honest and balanced - don't create false alarms.

Return a red flag score from 1-10 and list specific red flags found with brief, humorous explanations. If no red flags are detected, return score 1 and empty redFlags array.

Format ONLY as valid JSON:
{"score": number, "redFlags": [{"flag": string, "description": string}]}

DO NOT include any markdown, code blocks, or extra text. ONLY return the JSON object.`;

export async function POST(request: Request) {
  console.log("🚀 API /api/analyze appelée");
  console.log("🧪 USE_MOCK_DATA =", USE_MOCK_DATA);
  
  try {
    const { userId } = await auth();
    if (!userId) {
      console.log("❌ User not authenticated");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("✅ Utilisateur authentifié:", userId);

    // Check subscription and remaining scans
    const subscription = await getUserSubscription(userId);
    const hasPro = await hasProAccess(userId);
    console.log("📊 Subscription plan:", subscription.plan, "Has Pro:", hasPro, "Scans remaining:", subscription.scansRemaining);

    // Check if user can perform a scan
    if (!hasPro && subscription.scansRemaining !== null && subscription.scansRemaining <= 0) {
      console.log("🚫 Free scan limit reached");
      return NextResponse.json(
        { error: "Free scan limit reached. Upgrade to Pro!" },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("image");

    if (!(file instanceof File)) {
      console.log("❌ No file");
      return NextResponse.json(
        { error: "Image file missing" },
        { status: 400 }
      );
    }

    console.log("📁 File received:", file.name, file.type, file.size, "bytes");

    // Check file size (max 10MB)
    const MAX_FILE_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "Image is too large (max 10MB)" },
        { status: 400 }
      );
    }

    // Check file type
    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "File must be an image" },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64Image = buffer.toString("base64");

    let score: number;
    let redFlags: Array<{ flag: string; description: string }>;

    if (USE_MOCK_DATA) {
      // ============ MOCK DATA FOR TESTING ============
      console.log("🧪 MODE TEST: Utilisation de données mockées (OpenAI désactivé)");
      
      const analysisResult = {
        score: 7,
        redFlags: [
          {
            flag: "Gym selfie overload",
            description: "Every single photo is a gym mirror selfie. We get it, you lift bro."
          },
          {
            flag: "Generic bio syndrome",
            description: "Bio says 'Just ask 🤷‍♂️'. Very original."
          },
          {
            flag: "Mandatory fish pic",
            description: "The classic fish picture made an appearance. Dating app bingo complete!"
          },
          {
            flag: "Snapchat filter addiction",
            description: "Dog ears in 2025? Really?"
          }
        ]
      };
      
      score = analysisResult.score;
      redFlags = analysisResult.redFlags;
      console.log("✅ Mock data générées:", { score, redFlagsCount: redFlags.length });
      // ============ END MOCK DATA ============
    } else {
      // ============ REAL OPENAI CALL ============
      console.log("🤖 Appel OpenAI Vision...");
      
      let response;
      try {
        response = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: ANALYSIS_PROMPT,
                },
                {
                  type: "image_url",
                  image_url: {
                    url: `data:${file.type};base64,${base64Image}`,
                  },
                },
              ],
            },
          ],
          max_tokens: 1000,
        });
      } catch (openaiError: any) {
        console.error("❌ OpenAI API error:", openaiError);
        return NextResponse.json(
          { 
            error: "Error analyzing with AI", 
            details: openaiError.message || "Check your OpenAI API key and credits"
          },
          { status: 500 }
        );
      }

      const content = response.choices[0]?.message?.content;
      if (!content) {
        return NextResponse.json(
          { error: "No response from AI" },
          { status: 500 }
        );
      }

      console.log("✅ Raw GPT-4 response:", content);

      // Parse JSON response from GPT-4
      let analysisResult;
      try {
        const jsonMatch = content.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
        const jsonString = jsonMatch ? jsonMatch[1] : content;
        analysisResult = JSON.parse(jsonString);
      } catch (parseError) {
        console.error("❌ JSON parsing error:", content);
        analysisResult = {
          score: 5,
          redFlags: [
            {
              flag: "Incomplete analysis",
              description: "AI could not fully analyze this profile."
            }
          ]
        };
      }

      score = Math.max(1, Math.min(10, Number(analysisResult.score) || 1));
      redFlags = Array.isArray(analysisResult.redFlags)
        ? analysisResult.redFlags
            .filter(
              (flag: any) =>
                flag &&
                typeof flag === "object" &&
                typeof flag.flag === "string" &&
                typeof flag.description === "string"
            )
            .map((flag: any) => ({
              flag: flag.flag,
              description: flag.description,
            }))
        : [];
    }

    // Upload image to Supabase Storage
    console.log("☁️ Uploading to Supabase Storage...");
    
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
      console.error("❌ Supabase upload error:", uploadError);
      return NextResponse.json(
        { error: "Upload failed", details: uploadError.message },
        { status: 500 }
      );
    }

    console.log("✅ Image uploaded:", filePath);

    const { data: publicUrlData } = supabase.storage
      .from("scan-images")
      .getPublicUrl(filePath);
    const imageUrl = publicUrlData.publicUrl;

    // Save scan to database
    console.log("💾 Saving to database...");
    
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
      console.error("❌ Database insertion error:", error);
      return NextResponse.json(
        { error: "Database insertion failed", details: error.message },
        { status: 500 }
      );
    }

    console.log("✅ Scan saved with ID:", data.id);

    // Décrémenter les scans gratuits si l'utilisateur est gratuit
    if (!hasPro) {
      const remainingScans = await decrementFreeScans(userId);
      console.log("📉 Free scans remaining after scan:", remainingScans);
    }

    return NextResponse.json(
      {
        scanId: data.id,
        score,
        redFlags,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("💥 Global error in /api/analyze:", err);
    const message =
      err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
