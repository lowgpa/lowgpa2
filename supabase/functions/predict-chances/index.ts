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

        const apiKey = Deno.env.get('GEMINI_API_KEY')
        if (!apiKey) {
            throw new Error("GEMINI_API_KEY is not set in Edge Function secrets.")
        }

        const prompt = `You are an expert admission counselor for German Public Universities.
Please evaluate the following student profile for their chances of admission:

Nationality: ${profile.nationality || 'N/A'}
Bachelor's University: ${profile.bachelors_university || 'N/A'}
Degree Type: ${profile.degree_name || 'N/A'}
Graduation Year: ${profile.graduation_year || 'N/A'}
Native GPA: ${profile.native_gpa || 'N/A'}
German Grade Equivalent: ${profile.german_grade || 'N/A'}
English Proficiency: ${profile.english_proficiency || 'N/A'} (${profile.english_score || 'N/A'})
German Proficiency: ${profile.german_proficiency || 'N/A'}
Work Experience: ${profile.work_experience_years || '0'} years
Recent Role: ${profile.recent_role || 'N/A'}
Target Degree: ${profile.target_degree || 'N/A'}
Target Field: ${profile.desired_field || 'N/A'}

Instructions:
1. Provide a realistic and concise assessment of their chances (High, Medium, Low).
2. Detail 2-3 key strengths and 2-3 key weaknesses.
3. Be highly objective based on German public university standards.
4. Format your response beautifully in Markdown using headings, bold text, and bullet points. Keep it professional but encouraging.`

        const payload = {
            contents: [{
                parts: [{ text: prompt }]
            }]
        }

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        })

        const data = await response.json()

        if (data.error) {
            throw new Error(data.error.message || "Failed to call Gemini API")
        }

        const predictionText = data.candidates?.[0]?.content?.parts?.[0]?.text || "Unable to generate prediction."

        return new Response(
            JSON.stringify({ prediction: predictionText }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        })
    }
})
