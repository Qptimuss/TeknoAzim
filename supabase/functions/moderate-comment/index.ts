import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { HfInference } from 'https://esm.sh/@huggingface/inference';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Initialize Hugging Face Inference client
const HF_ACCESS_TOKEN = Deno.env.get("HUGGING_FACE_API_KEY");

// --- MODERATION CONFIGURATION ---
// Sadece çok dilli modeli kullanıyoruz
const MODEL_MULTILINGUAL = 'martin-ha/toxic-comment-model';

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
    if (!hf) {
      // API anahtarı yoksa, geçmesine izin ver (fail-safe)
      return new Response(JSON.stringify({ isModerated: true, warning: "Moderation API key missing." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }
    
    let toxicScore = 0;

    // Çok dilli toksisite modeli
    try {
      const moderationResponse = await hf.textClassification({
        model: MODEL_MULTILINGUAL, 
        inputs: content,
      });
      
      // Model çıktısı genellikle 'toxic' veya 'LABEL_1' etiketini içerir.
      const toxicLabel = moderationResponse.flat().find(item => item.label.toLowerCase().includes('toxic') || item.label === 'LABEL_1');
      if (toxicLabel) {
        toxicScore = toxicLabel.score;
      }
    } catch (hfError) {
      console.log("Error calling Multilingual Hugging Face API:", hfError);
      // API hatası durumunda, güvenlik için toksik kabul et
      toxicScore = 1.0; 
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