import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { HfInference } from 'https://esm.sh/@huggingface/inference@2.8.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// --- MODERATION CONFIGURATION ---
const HF_ACCESS_TOKEN = Deno.env.get("HUGGING_FACE_API_KEY");
const MODEL_ENGLISH = 'unitary/toxic-bert';

// Türkçe modelin çalıştığı Space URL (Sondaki eğik çizgi kaldırıldı)
const TURKISH_SPACE_URL = "https://qptimus-merhaba.hf.space/api/predict"; 

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

// HF client'ı sadece token varsa başlat
const hf = HF_ACCESS_TOKEN ? new HfInference(HF_ACCESS_TOKEN) : null;

// Türkçe modeli Space üzerinden çağırmak için helper
async function getTurkishScore(content: string): Promise<number> {
  if (!TURKISH_SPACE_URL) return 0; // URL yoksa atla

  const headers: Record<string, string> = {
      'Content-Type': 'application/json',
  };
  
  if (HF_ACCESS_TOKEN) {
      headers['Authorization'] = `Bearer ${HF_ACCESS_TOKEN}`;
  }

  const body = JSON.stringify({ data: [content] }); 
  
  console.log(`[Turkish Moderation] Sending request to: ${TURKISH_SPACE_URL}`);
  console.log(`[Turkish Moderation] Request body: ${body}`);

  try {
    const response = await fetch(TURKISH_SPACE_URL, {
      method: "POST",
      headers: headers,
      body: body,
    });
    
    console.log(`[Turkish Moderation] Response status: ${response.status}`);

    if (!response.ok) {
        const errorText = await response.text();
        console.error(`[Turkish Moderation] API Error Response: ${errorText}`);
        return 1.0; // API hatası durumunda toksik kabul et
    }

    const result = await response.json();
    console.log(`[Turkish Moderation] API Success Response Data: ${JSON.stringify(result)}`);

    // Space’in döndürdüğü yapı genellikle result.data[0]
    return result.data?.[0] ?? 0;
  } catch (err) {
    console.error("[Turkish Moderation] Network/Fetch Error:", err);
    return 1.0; // Ağ hatası durumunda toksik kabul et
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
    if (hf) {
        try {
          const englishModerationResponse = await hf.textClassification({
            model: MODEL_ENGLISH, 
            inputs: content,
          });
          const englishToxicLabel = englishModerationResponse.flat().find(item => item.label.toLowerCase().includes('toxic') || item.label === 'LABEL_1');
          if (englishToxicLabel) englishToxicScore = englishToxicLabel.score;
        } catch (err) {
          console.error("Error calling English model:", err);
          englishToxicScore = 1.0; // API hatası durumunda toksik kabul et
        }
    } else {
        console.warn("HUGGING_FACE_API_KEY is missing. Skipping English moderation.");
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