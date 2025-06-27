import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.39.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// SHA-256 password hashing function
async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const encoder = new TextEncoder();
  const data = encoder.encode(password + Array.from(salt).map(b => b.toString(16).padStart(2, '0')).join(''));
  
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  const saltHex = Array.from(salt).map(b => b.toString(16).padStart(2, '0')).join('');
  
  return `${saltHex}:${hashHex}`;
}

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders,
      status: 200,
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Environment variables are not set");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get data from request
    const { restaurant_id, created_by, name, email, password, permissions } = await req.json();
    
    if (!restaurant_id || !name || !email || !password) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    // Check if email already exists
    const { data: existingAccess } = await supabase
      .from('user_accesses')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (existingAccess) {
      return new Response(
        JSON.stringify({ error: "Email already exists" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 409,
        }
      );
    }
    
    // Hash password using SHA-256
    const passwordHash = await hashPassword(password);
    
    // Insert new access
    const { data, error } = await supabase
      .from('user_accesses')
      .insert([{
        restaurant_id,
        created_by,
        name,
        email,
        password_hash: passwordHash,
        permissions: permissions || {
          sales: true,
          expenses: true,
          dre: false,
          profile: false,
          dashboard: true,
          analytics: false,
          reports: false,
          settings: false
        }
      }])
      .select();

    if (error) {
      console.error("Database error:", error);
      throw error;
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Employee access created successfully",
        data: data[0]
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 201,
      }
    );
    
  } catch (error) {
    console.error("Error creating employee access:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});