import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { HfInference } from 'https://esm.sh/@huggingface/inference';
// Gradio istemcisi başarısız olduğu için kaldırıldı.
// import { client } from "https://esm.sh/@gradio/client"; 

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// --- MODERATION CONFIGURATION ---
const HF_ACCESS_TOKEN = Deno.env.get("HUGGING_FACE_API_KEY");
const MODEL_ENGLISH = 'unitary/toxic-bert';

// SON DÜZELTME: Gradio V4'ün en son ve generic API yolu denendi.
const TURKISH_SPACE_URL = "https://qptimus-merhaba.hf.space/api/predict/"; 

const TOXICITY_THRESHOLD = 0.7; 
const EXCEPTIONAL_PHRASE = "emailinizi falan girin üstten profilinizi oluşturun sonra buraya mesaj atin bakalım cidden calisiyo mu 😎";

function createSpammyRegex(word: string): string {
  return word.split('').map(char => `${char}+`).join('');
}

const WHOLE_WORD_BANNED = new Set([
]);

// HF client'ı sadece token varsa başlat
const hf = HF_ACCESS_TOKEN ? new HfInference(HF_ACCESS_TOKEN) : null;

// Türkçe modeli Space üzerinden çağırmak için helper
async function getTurkishScore(content: string): Promise<number> {
  if (!TURKISH_SPACE_URL) return 0; // URL yoksa atla

  const headers: Record<string, string> = {
            'Content-Type': 'application/json; charset=utf-8',
            'Accept': 'application/json',
  };
  
  if (HF_ACCESS_TOKEN) {
      headers['Authorization'] = `Bearer ${HF_ACCESS_TOKEN}`;
  }

    // GÜNCELLENDİ: Gradio V4'ün beklediği JSON formatı. fn_index = 0, analyze_toxicity fonksiyonunu temsil eder.
    const payload = { fn_index: 0, data: [content] };
    const body = JSON.stringify(payload);
    const encoder = new TextEncoder();
    const bodyBytes = encoder.encode(body);

    // Try setting explicit Content-Length and connection headers to avoid proxy truncation issues
    headers['Content-Length'] = String(bodyBytes.length);
    headers['Connection'] = 'close';

    // Log useful diagnostics for Content-Length problems
    console.log(`[Turkish Moderation] Sending request to: ${TURKISH_SPACE_URL}`);
    console.log(`[Turkish Moderation] Body string length: ${body.length}, bytes: ${bodyBytes.length}`);

    try {
        // Send body as bytes and perform manual redirect handling to avoid lost bodies on intermediate redirects
        let url = TURKISH_SPACE_URL;
        if (!url.endsWith('/')) url = url + '/';

        let response = await fetch(url, {
            method: "POST",
            headers: headers,
            body: bodyBytes,
            redirect: 'manual',
        });

        console.log(`[Turkish Moderation] Initial response status: ${response.status}`);

        // If there's a redirect (307/302/301/308) follow it manually to ensure body is resent correctly
        if ([301, 302, 307, 308].includes(response.status)) {
            const location = response.headers.get('location');
            if (location) {
                const followUrl = new URL(location, url).toString();
                console.log(`[Turkish Moderation] Following redirect to: ${followUrl}`);
                response = await fetch(followUrl, {
                    method: 'POST',
                    headers: headers,
                    body: bodyBytes,
                    redirect: 'follow',
                });
                console.log(`[Turkish Moderation] Followed response status: ${response.status}`);
            }
        }

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`[Turkish Moderation] API Error Response: ${errorText}`);
            return 0; // Hata durumunda 0 döndür
        }

        // Try to parse JSON; if parsing fails, log raw text
        const text = await response.text();
        let result: any = null;
        try {
            result = JSON.parse(text);
        } catch (e) {
            console.error('[Turkish Moderation] Failed to parse JSON response:', text);
            return 0;
        }

        console.log(`[Turkish Moderation] API Success Response Data: ${JSON.stringify(result)}`);

        // Gelen sonucun farklı yapılarını güvenli şekilde kontrol et
        if (result && result.data && Array.isArray(result.data)) {
            const first = result.data[0];
            if (typeof first === 'number') return first;
            if (Array.isArray(first) && typeof first[0] === 'number') return first[0];
            if (Array.isArray(first) && Array.isArray(first[0]) && typeof first[0][0] === 'number') return first[0][0];
            if (first && first.data && Array.isArray(first.data) && typeof first.data[0] === 'number') return first.data[0];
        }

        console.error('[Turkish Moderation] Unexpected Gradio response structure or missing score.');
        return 0;
    } catch (err) {
        console.error('[Turkish Moderation] Network/Fetch Error:', err);
        return 0; // Ağ hatası durumunda 0 döndür
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