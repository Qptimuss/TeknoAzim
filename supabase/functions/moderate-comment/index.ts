import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { HfInference } from 'https://esm.sh/@huggingface/inference';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Hugging Face Inference client (yalnızca İngilizce için)
const HF_ACCESS_TOKEN = Deno.env.get("HUGGING_FACE_API_KEY");
const MODEL_ENGLISH = 'unitary/toxic-bert';

// Türkçe modelin çalıştığı Space URL
const TURKISH_SPACE_URL = "https://Qptimus-merhaba.hf.space/api/predict/"; // burayı kendi Space URL’inle değiştir

const TOXICITY_THRESHOLD = 0.7; 
const EXCEPTIONAL_PHRASE = "emailinizi falan girin üstten profilinizi oluşturun sonra buraya mesaj atin bakalım cidden calisiyo mu 😎";

function createSpammyRegex(word: string): string {
  return word.split('').map(char => `${char}+`).join('');
}

const WHOLE_WORD_BANNED = new Set([
  "nigger", "fuck", "shit", "cunt", "asshole", "bitch", "bastard", "motherfucker", "faggot", "retard", "idiot", "moron",
  "kancık", "orospu", "piç", "puşt", "kahpe", "döl", "bok", "salak", "aptal", "gerizekalı", "beyinsiz", "mal", "ibne", "eşcinsel", "top",
  "porno", "sex", "vajina", "penis", "meme", "anal", "oral", "sikiş", "seks", "cinsel", "erotik", "çıplak", "pornografi", "mastürbasyon", "tecavüz", "ensest",
  "sakso", "grupseks", "oral seks", "anal seks", "grup seks",
  "sülale", "sülaleni", "pezevenk", "yarak"
]);

const hf = new HfInference(HF_ACCESS_TOKEN);

// Türkçe modeli Space üzerinden çağırmak için helper
async function getTurkishScore(content: string): Promise<number> {
  try {
    const response = await fetch(TURKISH_SPACE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data: [content] })
    });
    const result = await response.json();
    // Space’in döndürdüğü yapı genellikle result.data[0]
    return result.data?.[0] ?? 0;
  } catch (err) {
    console.error("Error calling Turkish Space:", err);
    return 0; // Hata durumunda 0 döndür
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { content } = await req.json();
    if (!content || typeof content !== 'string') {
      return new Response(JSON.stringify({ error: "Missing or invalid 'content' field." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (content === EXCEPTIONAL_PHRASE) {
      return new Response(JSON.stringify({ isModerated: true, toxicityScore: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Yasaklı kelime kontrolü
    const lowerCaseContent = content.toLowerCase();
    let containsBannedWord = false;
    for (const word of WHOLE_WORD_BANNED) {
      const spammyWordRegex = new RegExp(`\\b${createSpammyRegex(word)}\\b`, 'i'); 
      if (spammyWordRegex.test(lowerCaseContent)) {
        containsBannedWord = true;
        break;
      }
    }

    if (containsBannedWord) {
      return new Response(JSON.stringify({ isModerated: false, toxicityScore: 1.0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // İngilizce model
    let englishToxicScore = 0;
    try {
      const englishModerationResponse = await hf.textClassification({
        model: MODEL_ENGLISH, 
        inputs: content,
      });
      const englishToxicLabel = englishModerationResponse.flat().find(item => item.label.toLowerCase().includes('toxic') || item.label === 'LABEL_1');
      if (englishToxicLabel) englishToxicScore = englishToxicLabel.score;
    } catch (err) {
      console.log("Error calling English model:", err);
    }

    // Türkçe model (Space üzerinden)
    const turkishToxicScore = await getTurkishScore(content);

    // Sonuçları birleştir
    const combinedToxicScore = Math.max(englishToxicScore, turkishToxicScore);
    const isToxic = combinedToxicScore > TOXICITY_THRESHOLD;
    const isModerated = !isToxic;

    return new Response(JSON.stringify({ isModerated, toxicityScore: combinedToxicScore }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("General Error:", error);
    return new Response(JSON.stringify({ error: "Failed to process comment moderation." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});