import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { HfInference } from 'https://esm.sh/@huggingface/inference@4.13.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Initialize Hugging Face Inference client
const HF_ACCESS_TOKEN = Deno.env.get("HUGGING_FACE_API_KEY");

// --- MODERATION CONFIGURATION ---
const HF_MODEL = 'unitary/toxic-bert';
const TOXICITY_THRESHOLD = 0.7;
const CHUNK_SIZE_WORDS = 100; // Token limitini kesin olarak aşmamak için kelime sayısını 100'e düşürdük.

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

    // 1. Açık anahtar kelime kontrolü (API çağırmadan önce)
    const lowerCaseContent = content.toLowerCase();
    let containsBannedWord = false;

    // A. Tam kelime eşleşmesi kontrolü
    for (const word of WHOLE_WORD_BANNED) {
      const spammyWordRegex = new RegExp(`\\b${createSpammyRegex(word)}\\b`, 'i'); 
      if (spammyWordRegex.test(lowerCaseContent)) {
        containsBannedWord = true;
        break;
      }
    }
    
    // B. Kısmi kelime eşleşmesi kontrolü
    if (!containsBannedWord) {
        for (const word of PARTIAL_WORD_BANNED) {
            const spammyWordRegex = new RegExp(createSpammyRegex(word), 'i'); 
            if (spammyWordRegex.test(lowerCaseContent)) {
                containsBannedWord = true;
                break;
            }
        }
    }

    if (containsBannedWord) {
      return new Response(JSON.stringify({ isModerated: false, toxicityScore: 1.0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // 2. Hugging Face toksisite denetimi
    if (!hf) {
      return new Response(JSON.stringify({ error: "Moderation API key is missing or invalid. Please set HUGGING_FACE_API_KEY secret." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }
    
    // --- Metni parçalara ayırma (Chunking) ---
    const words = content.split(/\s+/); // Metni kelimelere ayır
    const chunks: string[] = [];
    for (let i = 0; i < words.length; i += CHUNK_SIZE_WORDS) {
      const chunk = words.slice(i, i + CHUNK_SIZE_WORDS).join(' ');
      chunks.push(chunk);
    }

    if (chunks.length === 0) {
      return new Response(JSON.stringify({ isModerated: true, toxicityScore: 0 }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let maxToxicScore = 0;

    try {
      // Tüm parçaları paralel olarak denetle
      const moderationPromises = chunks.map(chunk => 
        hf.textClassification({
          model: HF_MODEL, 
          inputs: chunk,
        })
      );
      
      const moderationResults = await Promise.all(moderationPromises);
      
      // Tüm sonuçları tek bir dizide birleştir
      const allScores = moderationResults.flat(2);

      const toxicLabels = allScores.filter(item => 
        item.label.toLowerCase() !== 'non-toxic' && item.label !== 'LABEL_0'
      );
      
      if (toxicLabels.length > 0) {
        maxToxicScore = Math.max(...toxicLabels.map(item => item.score));
      } else {
        const label1 = allScores.find(item => item.label === 'LABEL_1');
        if (label1) {
            maxToxicScore = Math.max(maxToxicScore, label1.score);
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

    const isToxic = maxToxicScore > TOXICITY_THRESHOLD;
    const isModerated = !isToxic;

    return new Response(JSON.stringify({ 
      isModerated, 
      toxicityScore: maxToxicScore,
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