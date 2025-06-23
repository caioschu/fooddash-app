import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.39.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders,
      status: 200,
    });
  }

  try {
    console.log("Starting make-admin function");
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("Environment variables are not set");
      throw new Error("Environment variables are not set");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get email from request
    const requestData = await req.json();
    const { email } = requestData;
    
    console.log("Request to promote user:", email);
    
    if (!email) {
      return new Response(
        JSON.stringify({ error: "Email is required" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }
    
    // Find user by email
    console.log("Looking up user in database");
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, email, tipo_usuario')
      .eq('email', email)
      .single();
    
    if (userError) {
      console.log("User not found in users table, checking auth");
      // If user not found, check if they exist in auth but not in users table
      const { data: authData, error: authError } = await supabase.auth.admin.listUsers();
      
      if (authError) {
        console.error("Error checking auth users:", authError);
        return new Response(
          JSON.stringify({ error: `Error checking auth users: ${authError.message}` }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 500,
          }
        );
      }
      
      const matchingAuthUser = authData.users.find(u => u.email === email);
      
      if (!matchingAuthUser) {
        console.error("User not found in auth system");
        return new Response(
          JSON.stringify({ error: `User with email ${email} not found` }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 404,
          }
        );
      }
      
      console.log("User found in auth, creating user record");
      // User exists in auth but not in users table, create them
      const { data: newUser, error: insertError } = await supabase
        .from('users')
        .insert([{
          id: matchingAuthUser.id,
          email: matchingAuthUser.email,
          tipo_usuario: 'admin',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();
      
      if (insertError) {
        console.error("Failed to create user record:", insertError);
        return new Response(
          JSON.stringify({ error: `Failed to create user record: ${insertError.message}` }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 500,
          }
        );
      }
      
      console.log("User created and promoted to admin");
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: `User ${email} has been created and promoted to admin`,
          user: {
            id: newUser.id,
            email: newUser.email,
            previous_role: null,
            new_role: 'admin'
          }
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }
    
    console.log("User found in database, current role:", userData.tipo_usuario);
    // If user already admin, return success
    if (userData.tipo_usuario === 'admin') {
      console.log("User is already an admin");
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: `User ${email} is already an admin`,
          user: {
            id: userData.id,
            email: userData.email,
            previous_role: 'admin',
            new_role: 'admin'
          }
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }
    
    console.log("Updating user to admin role");
    // Update user to admin
    const { error: updateError } = await supabase
      .from('users')
      .update({ 
        tipo_usuario: 'admin',
        updated_at: new Date().toISOString()
      })
      .eq('id', userData.id);
    
    if (updateError) {
      console.error("Failed to update user:", updateError);
      return new Response(
        JSON.stringify({ error: `Failed to update user: ${updateError.message}` }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        }
      );
    }
    
    console.log("User successfully promoted to admin");
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `User ${email} has been promoted to admin`,
        user: {
          id: userData.id,
          email: userData.email,
          previous_role: userData.tipo_usuario,
          new_role: 'admin'
        }
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
    
  } catch (error) {
    console.error("Error promoting user to admin:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});