import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { HfInference } from "https://esm.sh/@huggingface/inference@2.7.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Initialize Hugging Face Inference client
const HF_ACCESS_TOKEN = Deno.env.get("HUGGING_FACE_API_KEY");
const MODEL_NAME = "cagrigungor/turkishtoxic";

if (!HF_ACCESS_TOKEN) {
  console.error("HUGGING_FACE_API_KEY is not set.");
}

const hf = new HfInference(HF_ACCESS_TOKEN);

// Toxicity threshold: If the model scores 'toxic' above this value, the comment is rejected.
const TOXICITY_THRESHOLD = 0.8; 

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { content } = await req.json();

    if (!content || typeof content !== 'string') {
      return new Response(JSON.stringify({ error: "Missing or invalid 'content' field." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 1. Run inference
    const result = await hf.textClassification({
      model: MODEL_NAME,
      inputs: content,
    });

    // Find the score for the 'toxic' label
    const toxicLabel = result.flat().find(item => item.label.toLowerCase().includes('toxic'));
    
    let isToxic = false;
    if (toxicLabel && toxicLabel.score > TOXICITY_THRESHOLD) {
      isToxic = true;
    }

    // isModerated: true means the comment is safe and approved.
    const isModerated = !isToxic;

    return new Response(JSON.stringify({ 
      isModerated, 
      toxicityScore: toxicLabel?.score,
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Edge Function Error:", error);
    return new Response(JSON.stringify({ error: "Failed to process comment moderation." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});