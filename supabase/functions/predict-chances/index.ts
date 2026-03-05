import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { profile } = await req.json()

        // Worker URL stored as secret - never exposed in code or GitHub
        const CLOUDFLARE_WORKER_URL = Deno.env.get('CLOUDFLARE_WORKER_URL')
        if (!CLOUDFLARE_WORKER_URL) {
            throw new Error("CLOUDFLARE_WORKER_URL secret is not set.")
        }

        const response = await fetch(CLOUDFLARE_WORKER_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ profile })
        })

        const data = await response.json()

        if (!response.ok || data.error) {
            console.error("Cloudflare Worker Error:", data)
            throw new Error(data.error || `Worker returned status ${response.status}`)
        }

        const predictionText = data.prediction || "Unable to generate prediction."

        return new Response(
            JSON.stringify({ prediction: predictionText }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    } catch (error: unknown) {
        console.error("Function Error:", error)
        const message = error instanceof Error ? error.message : "An unknown error occurred"
        return new Response(JSON.stringify({ error: message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        })
    }
})
