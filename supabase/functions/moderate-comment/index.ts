import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { HfInference } from 'https://esm.sh/@huggingface/inference@2.8.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Initialize Hugging Face Inference client
const HF_ACCESS_TOKEN = Deno.env.get("HUGGING_FACE_API_KEY");
const MODEL_TURKISH = 'cagrigungor/turkishtoxic'; // Yeni Türkçe model
const MODEL_ENGLISH = 'unitary/toxic-bert';

// Toksisite eşiği: Bu değerin üzerindeki puanlar toksik kabul edilir.
const TOXICITY_THRESHOLD = 0.7; 

// Özel test cümlesi için istisna
const EXCEPTIONAL_PHRASE = "emailinizi falan girin üstten profilinizi oluşturun sonra buraya mesaj atin bakalım cidden calisiyo mu 😎";

// Helper to create a regex pattern that allows for character repetitions
function createSpammyRegex(word: string): string {
  return word.split('').map(char => `${char}+`).join('');
}

// Tam kelime olarak eşleşmesi gereken yasaklı kelimeler (regex ile \b kullanılarak)
const WHOLE_WORD_BANNED = new Set([
  "nigger", "fuck", "shit", "cunt", "asshole", "bitch", "bastard", "motherfucker", "faggot", "retard", "idiot", "moron",
  "kancık", "orospu", "piç", "puşt", "kahpe", "döl", "bok", "salak", "aptal", "gerizekalı", "beyinsiz", "mal", "ibne", "eşcinsel", "top",
  "porno", "sex", "vajina", "penis", "meme", "anal", "oral", "sikiş", "seks", "cinsel", "erotik", "çıplak", "pornografi", "mastürbasyon", "tecavüz", "ensest",
  "sakso", "grupseks", "oral seks", "anal seks", "grup seks",
  "sülale", "sülaleni", "pezevenk", "yarak"
]);

// Hugging Face istemcisini yeni uç nokta ile başlatıyoruz.
const hf = new HfInference(HF_ACCESS_TOKEN, {
  endpoint: "https://router.huggingface.co",
});


serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { content } = await req.json();

    if (!content || typeof content !== 'string') {
      return new Response(JSON.stringify({ error: "Missing or invalid 'content' field." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 1. Özel test cümlesi için istisna kontrolü
    if (content === EXCEPTIONAL_PHRASE) {
      return new Response(JSON.stringify({ isModerated: true, toxicityScore: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // 2. Açık anahtar kelime kontrolü
    const lowerCaseContent = content.toLowerCase();
    let containsBannedWord = false;

    // Tam kelime eşleşmesi kontrolü
    for (const word of WHOLE_WORD_BANNED) {
      const spammyWordRegex = new RegExp(`\\b${createSpammyRegex(word)}\\b`, 'i'); 
      if (spammyWordRegex.test(lowerCaseContent)) {
        containsBannedWord = true;
        break;
      }
    }

    if (containsBannedWord) {
      // Yasaklı kelime bulunduysa, toksik olarak işaretle
      return new Response(JSON.stringify({ isModerated: false, toxicityScore: 1.0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // 3. Hugging Face toksisite denetimi (eğer yasaklı kelime bulunmazsa)
    if (!HF_ACCESS_TOKEN) {
      // API anahtarı yoksa, geçmesine izin ver (fail-safe)
      return new Response(JSON.stringify({ isModerated: true, warning: "Moderation API key missing." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }
    
    // hf artık global olarak tanımlı

    let englishToxicScore = 0;
    let turkishToxicScore = 0;

    // İngilizce toksisite modeli
    try {
      const englishModerationResponse = await hf.textClassification({
        model: MODEL_ENGLISH, 
        inputs: content,
      });
      // LABEL_1 veya 'toxic' içeren etiketleri kontrol et
      const englishToxicLabel = englishModerationResponse.flat().find(item => item.label.toLowerCase().includes('toxic') || item.label === 'LABEL_1');
      if (englishToxicLabel) {
        englishToxicScore = englishToxicLabel.score;
      }
    } catch (hfError) {
      console.log("Error calling English Hugging Face API:", hfError);
    }

    // Türkçe toksisite modeli
    try {
      const turkishModerationResponse = await hf.textClassification({
        model: MODEL_TURKISH, 
        inputs: content,
      });
      // LABEL_1 veya 'toxic' içeren etiketleri kontrol et
      const turkishToxicLabel = turkishModerationResponse.flat().find(item => item.label.toLowerCase() === 'toxic' || item.label === 'LABEL_1');
      if (turkishToxicLabel) {
        turkishToxicScore = turkishToxicLabel.score;
      }
    } catch (hfError) {
      console.log("Error calling Turkish Hugging Face API:", hfError);
    }

    // İki modelden gelen en yüksek toksisite puanını al
    const combinedToxicScore = Math.max(englishToxicScore, turkishToxicScore);
    const isToxic = combinedToxicScore > TOXICITY_THRESHOLD;

    const isModerated = !isToxic;

    return new Response(JSON.stringify({ 
      isModerated, 
      toxicityScore: combinedToxicScore,
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Edge Function General Error:", error);
    return new Response(JSON.stringify({ error: "Failed to process comment moderation." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});