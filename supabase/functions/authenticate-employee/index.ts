import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.39.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// SHA-256 password verification function
async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  try {
    const [saltHex, hashHex] = hashedPassword.split(':');
    if (!saltHex || !hashHex) return false;
    
    const salt = new Uint8Array(saltHex.match(/.{2}/g)!.map(byte => parseInt(byte, 16)));
    const encoder = new TextEncoder();
    const data = encoder.encode(password + Array.from(salt).map(b => b.toString(16).padStart(2, '0')).join(''));
    
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const computedHashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    return computedHashHex === hashHex;
  } catch (error) {
    console.error('Password verification error:', error);
    return false;
  }
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
    
    // Get email and password from request
    const { email, password } = await req.json();
    
    if (!email || !password) {
      return new Response(
        JSON.stringify({ error: "Email and password are required" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }
    
    // Find user access by email
    const { data: userAccess, error: userError } = await supabase
      .from('user_accesses')
      .select(`
        *,
        restaurants!user_accesses_restaurant_id_fkey (
          nome,
          logo_url,
          categoria_culinaria
        )
      `)
      .eq('email', email)
      .eq('active', true)
      .single();

    if (userError || !userAccess) {
      return new Response(
        JSON.stringify({ error: "Credenciais inválidas" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 401,
        }
      );
    }

    // Verify password
    const isValidPassword = await verifyPassword(password, userAccess.password_hash);
    
    if (!isValidPassword) {
      return new Response(
        JSON.stringify({ error: "Credenciais inválidas" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 401,
        }
      );
    }

    // Update last login
    await supabase
      .from('user_accesses')
      .update({ last_login: new Date().toISOString() })
      .eq('id', userAccess.id);

    // Return user data (without password hash)
    const responseData = {
      id: userAccess.id,
      restaurant_id: userAccess.restaurant_id,
      restaurant_name: userAccess.restaurants?.nome || 'Restaurante',
      restaurant_logo: userAccess.restaurants?.logo_url,
      restaurant_category: userAccess.restaurants?.categoria_culinaria,
      name: userAccess.name,
      email: userAccess.email,
      permissions: userAccess.permissions,
      is_active: userAccess.active,
      last_login: userAccess.last_login
    };

    return new Response(
      JSON.stringify(responseData),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
    
  } catch (error) {
    console.error('Error authenticating employee:', error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});