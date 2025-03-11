// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SmtpClient } from "https://deno.land/x/smtp@v0.7.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders,
    });
  }

  // Get environment variables
  const SMTP_HOST = Deno.env.get("SMTP_HOST") || "";
  const SMTP_PORT = parseInt(Deno.env.get("SMTP_PORT") || "587");
  const SMTP_USERNAME = Deno.env.get("SMTP_USERNAME") || "";
  const SMTP_PASSWORD = Deno.env.get("SMTP_PASSWORD") || "";
  const EMAIL_FROM = Deno.env.get("EMAIL_FROM") || "";

  // Verify SMTP configuration
  if (!SMTP_HOST || !SMTP_USERNAME || !SMTP_PASSWORD || !EMAIL_FROM) {
    return new Response(
      JSON.stringify({
        error: "SMTP configuration is incomplete",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      },
    );
  }

  try {
    // Parse request body
    const { to, subject, html } = await req.json();

    // Validate required fields
    if (!to || !subject || !html) {
      return new Response(
        JSON.stringify({
          error: "Missing required fields: to, subject, or html",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        },
      );
    }

    // Configure SMTP client
    const client = new SmtpClient();
    await client.connectTLS({
      host: SMTP_HOST,
      port: SMTP_PORT,
      username: SMTP_USERNAME,
      password: SMTP_PASSWORD,
    });

    // Send email
    await client.send({
      from: EMAIL_FROM,
      to: to,
      subject: subject,
      content: html,
      html: html,
    });

    await client.close();

    return new Response(
      JSON.stringify({ success: true, message: "Email sent successfully" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      },
    );
  } catch (error) {
    console.error("Error sending email:", error);
    return new Response(
      JSON.stringify({
        error: `Failed to send email: ${error.message}`,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      },
    );
  }
});
