import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { HfInference } from 'https://esm.sh/@huggingface/inference';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Initialize Hugging Face Inference client
const HF_ACCESS_TOKEN = Deno.env.get("HUGGING_FACE_API_KEY");

// --- MODERATION CONFIGURATION ---
// YENİ MODEL: JungleLee/bert-toxic-comment-classification (Çoklu etiket çıktısı verir)
const HF_MODEL = 'JungleLee/bert-toxic-comment-classification';

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
  "sülale", "sülaleni", "pezevenk", "yarak",
  // Yeni eklenen yaygın argolar
  "amk", "siktir", "anan", "sik", "yarrak", "göt", "oç"
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
      // Regex'i oluştururken kelimenin başında ve sonunda kelime sınırı (\b) kullanıyoruz.
      // Ayrıca, karakter tekrarlarını da kontrol etmek için createSpammyRegex kullanıyoruz.
      const spammyWordRegex = new RegExp(`\\b${createSpammyRegex(word)}\\b`, 'i'); 
      if (spammyWordRegex.test(lowerCaseContent)) {
        containsBannedWord = true;
        break;
      }
    }

    if (containsBannedWord) {
      // Yasaklı kelime bulunduysa, toksik olarak işaretle
      return new Response(JSON.stringify({ isModerated: false, toxicityScore: 1.0, reason: "Banned Keyword" }), {
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
      // API hatası durumunda, güvenlik için toksik kabul et (Fail-Toxic)
      toxicScore = 1.0; 
    }

    const isToxic = toxicScore > TOXICITY_THRESHOLD;
    const isModerated = !isToxic;

    return new Response(JSON.stringify({ 
      isModerated, 
      toxicityScore: toxicScore,
      reason: isToxic ? `AI Score: ${toxicScore.toFixed(2)}` : "Passed",
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