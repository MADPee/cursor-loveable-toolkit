import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

/**
 * Secure Edge Function Template
 * 
 * Denna mall innehåller alla säkerhetskontroller som krävs för Edge Functions:
 * - Autentisering via Supabase Auth
 * - Input validation
 * - CORS headers
 * - Error handling utan att läcka känslig data
 * - SSRF protection för fetch calls
 * - Rate limiting
 * - Logging utan secrets
 */

// CORS headers - ALLTID inkludera dessa
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Domain whitelist för SSRF protection
const ALLOWED_DOMAINS = [
  'ica.se',
  'coop.se', 
  'koket.se',
  'arla.se',
  'tasteline.com',
  'lindasbakskola.se'
];

// Rate limiting configuration
const RATE_LIMITS = {
  requests_per_minute: 60,
  requests_per_hour: 1000
};

// Input validation helpers
function validateUrl(url: string): boolean {
  try {
    const parsedUrl = new URL(url);
    
    // Block private IP ranges
    if (parsedUrl.hostname === 'localhost' ||
        parsedUrl.hostname === '127.0.0.1' ||
        parsedUrl.hostname.startsWith('192.168.') ||
        parsedUrl.hostname.startsWith('10.') ||
        parsedUrl.hostname.startsWith('172.16.') ||
        parsedUrl.hostname === '169.254.169.254') {
      return false;
    }
    
    // Check against whitelist
    return ALLOWED_DOMAINS.some(domain => 
      parsedUrl.hostname === domain || 
      parsedUrl.hostname.endsWith('.' + domain)
    );
  } catch {
    return false;
  }
}

function validateString(input: unknown, fieldName: string, maxLength = 1000): string {
  if (typeof input !== 'string') {
    throw new Error(`${fieldName} must be a string`);
  }
  
  if (input.length === 0) {
    throw new Error(`${fieldName} cannot be empty`);
  }
  
  if (input.length > maxLength) {
    throw new Error(`${fieldName} too long (max ${maxLength} characters)`);
  }
  
  return input;
}

function validateImageSize(imageData: Uint8Array, maxSizeMB = 10): void {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  
  if (imageData.length > maxSizeBytes) {
    throw new Error(`Image too large. Maximum ${maxSizeMB} MB allowed.`);
  }
}

// Authentication helper
async function authenticateUser(req: Request): Promise<{ user: any; supabase: any }> {
  const authHeader = req.headers.get('Authorization');
  
  if (!authHeader) {
    throw new Error('Authorization header required');
  }
  
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } }
  );
  
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    throw new Error('Invalid authentication token');
  }
  
  return { user, supabase };
}

// Rate limiting helper (simplified - in production use Redis or database)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const userLimit = rateLimitStore.get(userId);
  
  if (!userLimit || now > userLimit.resetTime) {
    rateLimitStore.set(userId, { count: 1, resetTime: now + 60000 }); // 1 minute window
    return true;
  }
  
  if (userLimit.count >= RATE_LIMITS.requests_per_minute) {
    return false;
  }
  
  userLimit.count++;
  return true;
}

// Secure fetch helper with timeout
async function secureFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'User-Agent': 'Receptapp/1.0',
        ...options.headers
      }
    });
    
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

// Error response helper
function createErrorResponse(message: string, status = 400): Response {
  return new Response(
    JSON.stringify({ error: message }),
    {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    }
  );
}

// Success response helper
function createSuccessResponse(data: any): Response {
  return new Response(
    JSON.stringify(data),
    {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    }
  );
}

// Main handler
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // 1. Authenticate user
    const { user, supabase } = await authenticateUser(req);
    
    // 2. Check rate limit
    if (!checkRateLimit(user.id)) {
      return createErrorResponse('Rate limit exceeded', 429);
    }
    
    // 3. Parse and validate input
    const body = await req.json();
    
    // Example: Validate required fields
    const url = validateString(body.url, 'URL', 2000);
    
    // Example: Validate URL domain
    if (!validateUrl(url)) {
      return createErrorResponse('Domain not allowed', 403);
    }
    
    // 4. Perform the main operation
    const response = await secureFetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.statusText}`);
    }
    
    const data = await response.text();
    
    // 5. Process data safely (sanitize if needed)
    const processedData = {
      content: data.substring(0, 10000), // Limit content size
      status: 'success',
      timestamp: new Date().toISOString()
    };
    
    // 6. Log operation (without sensitive data)
    console.log(`Operation completed for user ${user.id.substring(0, 8)}...`);
    
    return createSuccessResponse(processedData);
    
  } catch (error) {
    // Secure error handling - don't leak sensitive information
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    
    // Log error details (but not sensitive data)
    console.error('Edge function error:', {
      message: errorMessage,
      timestamp: new Date().toISOString(),
      // Don't log user data, request body, or other sensitive info
    });
    
    // Return generic error to client
    return createErrorResponse('Operation failed', 500);
  }
});

/**
 * USAGE EXAMPLES:
 * 
 * 1. För recipe fetching:
 *    - Validera URL mot ALLOWED_DOMAINS
 *    - Använd secureFetch med timeout
 *    - Sanitera HTML-innehåll
 * 
 * 2. För image upload:
 *    - Validera bildstorlek med validateImageSize
 *    - Kontrollera filtyp
 *    - Verifiera recipe ownership
 * 
 * 3. För data processing:
 *    - Validera alla input parameters
 *    - Använd rate limiting
 *    - Logga säkert utan secrets
 * 
 * SECURITY CHECKLIST:
 * ✅ Authentication required
 * ✅ Input validation
 * ✅ CORS headers
 * ✅ Error handling
 * ✅ SSRF protection
 * ✅ Rate limiting
 * ✅ Secure logging
 * ✅ Timeout protection
 * ✅ Size limits
 * ✅ Domain whitelist
 */
