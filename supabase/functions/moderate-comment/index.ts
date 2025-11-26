import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { HfInference } from 'https://esm.sh/@huggingface/inference';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Initialize Hugging Face Inference client
const HF_ACCESS_TOKEN = Deno.env.get("HUGGING_FACE_API_KEY");

// --- MODERATION CONFIGURATION ---
const HF_MODEL = 'unitary/toxic-bert';
const TOXICITY_THRESHOLD = 0.7; 

// Helper to create a regex pattern that allows for character repetitions
function createSpammyRegex(word: string): string {
  return word.split('').map(char => `${char}+`).join('');
}

// Tam kelime olarak eşleşmesi gereken yasaklı kelimeler (regex ile \b kullanılarak)
const WHOLE_WORD_BANNED = new Set([
  "nigger", "fuck", "shit", "cunt", "asshole", "bitch", "bastard", "motherfucker", "faggot", "retard", "idiot", "moron",
  "kancık", "orospu", "piç", "puşt", "kahpe", "döl", "bok", "salak", "aptal", "gerizekalı", "beyinsiz", "mal", "ibne", "top",
  "porno", "sex", "vajina", "penis", "meme", "anal", "oral", "sikiş", "seks", "cinsel", "erotik", "çıplak", "pornografi", "mastürbasyon", "tecavüz", "ensest",
  "sakso", "grupseks", "oral seks", "anal seks", "grup seks",
  "sülale", "sülaleni", "pezevenk", "yarak",
  // Yaygın argolar ve varyasyonları
  "amk", "siktir", "anan", "sik", "yarrak", "göt", "oç", "amcık", "am", 
  "sikişmek", "sikişiyor", 
]);

// Kelime sınırı olmadan, metnin herhangi bir yerinde geçiyorsa engellenecek kelimeler
// Bu liste, çok hassas kelimeler için kullanılır.
const PARTIAL_WORD_BANNED = new Set([
    "sikiş", // Sadece bu kelimeyi kelime sınırı olmadan kontrol ediyoruz
]);

// Hugging Face istemcisini sadece token ile başlatıyoruz.
const hf = HF_ACCESS_TOKEN ? new HfInference(HF_ACCESS_TOKEN) : null;


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

    // 2. Açık anahtar kelime kontrolü
    const lowerCaseContent = content.toLowerCase();
    let containsBannedWord = false;

    // A. Tam kelime eşleşmesi kontrolü (daha güvenli)
    for (const word of WHOLE_WORD_BANNED) {
      // Kelime sınırlarını kullanarak tam kelime veya varyasyonlarını kontrol et
      const spammyWordRegex = new RegExp(`\\b${createSpammyRegex(word)}\\b`, 'i'); 
      if (spammyWordRegex.test(lowerCaseContent)) {
        containsBannedWord = true;
        break;
      }
    }
    
    // B. Kısmi kelime eşleşmesi kontrolü (daha agresif)
    if (!containsBannedWord) {
        for (const word of PARTIAL_WORD_BANNED) {
            // Kelime sınırları olmadan, sadece içerip içermediğini kontrol et
            const spammyWordRegex = new RegExp(createSpammyRegex(word), 'i'); 
            if (spammyWordRegex.test(lowerCaseContent)) {
                containsBannedWord = true;
                break;
            }
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
    if (!hf) {
      // API anahtarı yoksa, hata döndür
      return new Response(JSON.stringify({ error: "Moderation API key is missing or invalid. Please set HUGGING_FACE_API_KEY secret." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }
    
    let toxicScore = 0;

    try {
      const moderationResponse = await hf.textClassification({
        model: HF_MODEL, 
        inputs: content,
      });
      
      const scores = moderationResponse.flat();
      
      const toxicLabels = scores.filter(item => 
        item.label.toLowerCase() !== 'non-toxic' && item.label !== 'LABEL_0'
      );
      
      if (toxicLabels.length > 0) {
        // Toksik etiketler arasında en yüksek puanı al
        toxicScore = Math.max(...toxicLabels.map(item => item.score));
      } else {
        // Eğer model sadece LABEL_0/LABEL_1 döndürüyorsa ve LABEL_1 toksikse, onu al.
        const label1 = scores.find(item => item.label === 'LABEL_1');
        if (label1) {
            toxicScore = label1.score;
        }
      }

    } catch (hfError) {
      console.log("Error calling Hugging Face API:", hfError);
      let errorMessage = "External Moderation API call failed.";
      if (hfError.message.includes("401")) {
        errorMessage = "Hugging Face API key is invalid or missing. Please check the 'HUGGING_FACE_API_KEY' secret in your Supabase project settings.";
      } else {
        errorMessage = `Hugging Face API error: ${hfError.message}`;
      }
      return new Response(JSON.stringify({ error: errorMessage }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }

    const isToxic = toxicScore > TOXICITY_THRESHOLD;
    const isModerated = !isToxic;

    return new Response(JSON.stringify({ 
      isModerated, 
      toxicityScore: toxicScore,
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