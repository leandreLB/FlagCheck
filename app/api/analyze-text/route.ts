import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import OpenAI from "openai";
import { supabase } from "@/lib/supabase";
import { ScanRecord } from "@/lib/types";
import { getUserSubscription, hasProAccess, decrementFreeScans } from "@/lib/subscription";

export const runtime = "nodejs";

const USE_MOCK_DATA = false;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "fake-key-for-mock",
});

const TEXT_ANALYSIS_PROMPT = `You are a dating profile expert. Analyze this textual description of a person and identify RED FLAGS.

IMPORTANT SCORING GUIDELINES:
- 1-2/10: Healthy, legitimate profiles with NO red flags. This should be the DEFAULT for most normal profiles. Only give 1-2 if the description is genuinely clean and shows no concerning patterns.
- 3-6/10: Moderate red flags - minor concerns like generic descriptions, some clichés, or harmless quirks. These are NOT serious issues.
- 7-10/10: SERIOUS red flags ONLY - scammers, narcissists, manipulators, dangerous behavior, or multiple major warning signs. Reserve these scores for genuinely problematic profiles.

Common red flags to look for:
- Claims of extreme success at a very young age (e.g., "CEO at 23")
- Unrealistic lifestyle claims
- Overly aggressive or negative language
- Signs of manipulation or gaslighting
- Inconsistent stories or contradictions
- Red flags in communication style
- Suspicious behavior patterns
- Warning signs about personality or character

CRITICAL: Most profiles should score 1-2/10. Only use higher scores for REAL problems. Be honest and balanced - don't create false alarms.

Return a red flag score from 1-10 and list specific red flags found with brief, humorous explanations. If no red flags are detected, return score 1 and empty redFlags array.

Format ONLY as valid JSON:
{"score": number, "redFlags": [{"flag": string, "description": string}]}

DO NOT include any markdown, code blocks, or extra text. ONLY return the JSON object.`;

export async function POST(request: Request) {
  console.log("🚀 API /api/analyze-text appelée");
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

    const { description } = await request.json();

    if (!description || typeof description !== "string" || description.trim().length === 0) {
      console.log("❌ No description provided");
      return NextResponse.json(
        { error: "Description text is required" },
        { status: 400 }
      );
    }

    // Validate description length (max 2000 characters)
    if (description.length > 2000) {
      return NextResponse.json(
        { error: "Description is too long (max 2000 characters)" },
        { status: 400 }
      );
    }

    console.log("📝 Description received:", description.substring(0, 100) + "...");

    let score: number;
    let redFlags: Array<{ flag: string; description: string }>;

    if (USE_MOCK_DATA) {
      // ============ MOCK DATA FOR TESTING ============
      console.log("🧪 MODE TEST: Utilisation de données mockées (OpenAI désactivé)");
      
      const analysisResult = {
        score: 8,
        redFlags: [
          {
            flag: "CEO à 23 ans - Suspicious",
            description: "Prétendre être CEO à 23 ans sans fondation solide est souvent un signe d'arnaque ou d'ego surdimensionné."
          },
          {
            flag: "Trop parfait pour être vrai",
            description: "Si ça semble trop beau pour être vrai, c'est probablement le cas."
          },
          {
            flag: "Langage manipulateur",
            description: "Attention aux signes de manipulation dans la façon de communiquer."
          }
        ]
      };
      
      score = analysisResult.score;
      redFlags = analysisResult.redFlags;
      console.log("✅ Mock data générées:", { score, redFlagsCount: redFlags.length });
      // ============ END MOCK DATA ============
    } else {
      // ============ REAL OPENAI CALL ============
      console.log("🤖 Appel OpenAI pour analyse textuelle...");
      
      let response;
      try {
        response = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "user",
              content: `${TEXT_ANALYSIS_PROMPT}\n\nDescription:\n${description}`,
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
              description: "AI could not fully analyze this description."
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

    // Save scan to database (without image_url, using empty string as fallback)
    console.log("💾 Saving to database...");
    
    const { data, error } = await supabase
      .from("scans")
      .insert({
        user_id: userId,
        image_url: "", // Empty string for text-only scans (column might not accept null)
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
    console.error("💥 Global error in /api/analyze-text:", err);
    const message =
      err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

