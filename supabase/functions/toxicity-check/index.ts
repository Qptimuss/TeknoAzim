import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

// Using a more appropriate model for toxicity detection
const HUGGING_FACE_API_URL = "https://api-inference.huggingface.co/models/unitary/toxic-bert";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text } = await req.json();
    if (!text) {
      return new Response(JSON.stringify({ message: "Text to analyze is required." }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const HUGGING_FACE_API_KEY = Deno.env.get("HUGGING_FACE_API_KEY");
    if (!HUGGING_FACE_API_KEY) {
      console.error("HUGGING_FACE_API_KEY is not set in Supabase secrets.");
      return new Response(JSON.stringify({ 
        message: "Toxicity service is not configured properly.",
        details: "HUGGING_FACE_API_KEY is missing"
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const hfResponse = await fetch(HUGGING_FACE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${HUGGING_FACE_API_KEY}`
      },
      body: JSON.stringify({ inputs: text })
    });

    if (!hfResponse.ok) {
      const errorBody = await hfResponse.text();
      console.error("Hugging Face API error:", errorBody);
      
      // Return more detailed error in non-production environments
      if (Deno.env.get("DENO_ENV") !== "production") {
        return new Response(JSON.stringify({ 
          message: "Failed to analyze content.", 
          details: errorBody,
          status: hfResponse.status
        }), {
          status: 502,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } else {
        return new Response(JSON.stringify({ message: "Failed to analyze content." }), {
          status: 502,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    const result = await hfResponse.json();
    
    // Process the toxicity scores from the model
    let toxicityScore = 0;
    const labels = result[0];
    
    // The model returns multiple toxicity categories
    const toxicityCategories = [
      'toxic', 'severe_toxic', 'obscene', 'threat', 'insult', 'identity_hate'
    ];
    
    toxicityCategories.forEach(category => {
      const label = labels.find((l: { label: string }) => l.label === category);
      if (label) {
        toxicityScore = Math.max(toxicityScore, label.score);
      }
    });
    
    const isToxic = toxicityScore > 0.7;
    
    return new Response(JSON.stringify({ 
      isToxic, 
      toxicityScore, 
      message: "Content analyzed successfully.",
      details: labels
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error("Error in toxicity function:", error);
    // Return more detailed error in non-production environments
    if (Deno.env.get("DENO_ENV") !== "production") {
      return new Response(JSON.stringify({ 
        message: "An internal error occurred.", 
        error: error instanceof Error ? error.message : String(error)
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } else {
      return new Response(JSON.stringify({ message: "An internal error occurred." }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  }
});