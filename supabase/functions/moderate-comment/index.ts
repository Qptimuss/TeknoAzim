import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { HfInference } from 'https://esm.sh/@huggingface/inference@2.7.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Toksisite eşiği: Bu değerin üzerindeki puanlar toksik kabul edilir.
const TOXICITY_THRESHOLD = 0.8; 

// Helper to create a regex pattern that allows for character repetitions
// e.g., "porno" -> "p+o+r+n+o+"
function createSpammyRegex(word: string): string {
  return word.split('').map(char => `[${char}\\s]+`).join('');
}

// Tam kelime olarak eşleşmesi gereken yasaklı kelimeler (regex ile \b kullanılarak)
const WHOLE_WORD_BANNED = new Set([
  "nigger", "fuck", "shit", "cunt", "asshole", "bitch", "bastard", "motherfucker", "faggot", "retard", "idiot", "moron",
  "kancık", "orospu", "piç", "puşt", "kahpe", "döl", "bok", "salak", "aptal", "gerizekalı", "beyinsiz", "mal", "ibne", "top",
  "porno", "sex", "vajina", "penis", "meme", "anal", "oral", "sikiş", "seks", "cinsel", "erotik", "çıplak", "pornografi", "mastürbasyon", "tecavüz", "ensest",
  "sakso", "grupseks", "pezevenk", "yarak"
]);

// Alt dize olarak eşleşmesi gereken yasaklı kelimeler (includes kullanılarak)
const SUBSTRING_BANNED = new Set([
  "amk", "aq", "oç", "sikerim", "siktir git", "ananı", "yavşak", "gavat", "siktir lan", "götveren", "orosbu", "piçin", "ananın",
  "domal", "sik", "yarrak", "am", "göt",
  "siktir", 
  "amcık",
  "bacını"
]);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { commentId, content } = await req.json();
    console.log("Received comment for moderation:", { commentId, content });

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const huggingfaceApiKey = Deno.env.get("HUGGINGFACE_API_KEY");
    if (!huggingfaceApiKey) {
      throw new Error("Server configuration error: Hugging Face API key is missing.");
    }

    // 1. Açık anahtar kelime kontrolü
    const lowerCaseContent = content.toLowerCase().replace(/\s+/g, ''); // boşlukları kaldır
    let containsBannedWord = false;
    let flaggedWord = '';

    for (const word of [...WHOLE_WORD_BANNED, ...SUBSTRING_BANNED]) {
      const spammyWordRegex = new RegExp(createSpammyRegex(word), 'i');
      if (spammyWordRegex.test(lowerCaseContent)) {
        containsBannedWord = true;
        flaggedWord = word;
        break;
      }
    }

    if (containsBannedWord) {
      console.log(`Comment flagged by keyword filter: '${flaggedWord}'`);
      await supabaseAdmin.from("comments").update({ is_moderated: false }).eq("id", commentId);
      return new Response(JSON.stringify({ message: "Comment flagged by keyword filter." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200,
      });
    }

    // 2. Hugging Face toksisite denetimi
    const hf = new HfInference(huggingfaceApiKey);
    
    const turkishModerationResponse = await hf.textClassification({
      model: 'savasy/bert-base-turkish-cased-toxic-detection', 
      inputs: content,
    });
    
    const turkishToxicLabel = turkishModerationResponse.find(item => item.label.toLowerCase() === 'toxic');
    const isToxic = turkishToxicLabel && turkishToxicLabel.score > TOXICITY_THRESHOLD;

    console.log(`Moderation result: score=${turkishToxicLabel?.score}, is_toxic=${isToxic}`);

    await supabaseAdmin
      .from("comments")
      .update({ is_moderated: !isToxic })
      .eq("id", commentId);

    return new Response(JSON.stringify({ message: `Comment processed. Approved: ${!isToxic}` }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200,
    });

  } catch (error: any) {
    console.error("Error in moderate-comment function:", error.message || error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500,
    });
  }
});