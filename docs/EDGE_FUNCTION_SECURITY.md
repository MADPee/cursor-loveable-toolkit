# 🛡️ Edge Function Security Best Practices

Detaljerad guide för att skriva säkra Edge Functions med Supabase.

## 📋 Innehål

- [Authentication](#-authentication)
- [Input Validation](#-input-validation)
- [SSRF Protection](#-ssrf-protection)
- [Rate Limiting](#-rate-limiting)
- [Error Handling](#-error-handling)
- [Checklist](#-checklist)

## 🔐 Authentication

**REQUIREMENT:** Alla Edge Functions MÅSTE kräva autentisering.

### Implementation

```typescript
// ✅ ALLTID: Autentisering i Edge Functions
const authHeader = req.headers.get('Authorization');
if (!authHeader) {
  return new Response(JSON.stringify({ error: 'Unauthorized' }), {
    status: 401,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

// Skapa Supabase client med user's token
const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_ANON_KEY')!,
  { 
    global: { 
      headers: { Authorization: authHeader } 
    } 
  }
);

// Verifiera user
const { data: { user }, error } = await supabase.auth.getUser();
if (error || !user) {
  return new Response(JSON.stringify({ error: 'Invalid token' }), {
    status: 401,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

// Nu kan du använda user.id för säkra operationer
console.log(`Authenticated as: ${user.id}`);
```

### ALDRIG

```typescript
// ❌ ALDRIG: Edge Functions utan autentisering
serve(async (req) => {
  const { data } = await req.json();
  // Missing authentication check!
  await processData(data);
});

// ❌ ALDRIG: verify_jwt = false
// Don't disable JWT verification in supabase/config.toml
```

## ✍️ Input Validation

**REQUIREMENT:** Validera ALLA input parameters.

### Implementation

```typescript
// ✅ ALLTID: Type checking
const { url, imageSize } = await req.json();

if (typeof url !== 'string') {
  return new Response(
    JSON.stringify({ error: 'URL must be string' }),
    { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

// ✅ ALLTID: Length validation
const MAX_URL_LENGTH = 2000;
if (url.length === 0 || url.length > MAX_URL_LENGTH) {
  return new Response(
    JSON.stringify({ error: `URL must be 1-${MAX_URL_LENGTH} characters` }),
    { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

// ✅ ALLTID: Format validation
try {
  new URL(url); // Throws if invalid
} catch (error) {
  return new Response(
    JSON.stringify({ error: 'Invalid URL format' }),
    { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

// ✅ ALLTID: Range validation
if (imageSize < 100 || imageSize > 10 * 1024 * 1024) {
  return new Response(
    JSON.stringify({ error: 'Image size must be 100 bytes - 10 MB' }),
    { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}
```

### ALDRIG

```typescript
// ❌ ALDRI: Ingen validering
const { url, size } = await req.json();
const response = await fetch(url); // Could be anything!

// ❌ ALDRIG: Trusting client-provided user_id
const { user_id } = await req.json();
await updateUserData(user_id, data); // What if it's someone else's ID?

// ✅ ISTÄLLET: Always use authenticated user
const { data: { user } } = await supabase.auth.getUser();
await updateUserData(user.id, data); // Guaranteed to be current user
```

## 🔒 SSRF Protection

**REQUIREMENT:** Skydda mot Server-Side Request Forgery.

### Domain Whitelist

```typescript
// ✅ ALLTID: Domain whitelist
const ALLOWED_DOMAINS = [
  'ica.se',
  'coop.se',
  'koket.se',
  'arla.se',
  'tasteline.com',
  'lindasbakskola.se'
];

function isAllowedDomain(url: string): boolean {
  try {
    const parsedUrl = new URL(url);
    
    // Block private IP ranges
    const privateRanges = [
      'localhost',
      '127.0.0.1',
      '169.254.169.254', // AWS metadata
      /^192\.168\./,
      /^10\./,
      /^172\.1[6-9]\./,
      /^172\.2[0-9]\./,
      /^172\.3[01]\./
    ];
    
    for (const range of privateRanges) {
      if (typeof range === 'string') {
        if (parsedUrl.hostname === range) return false;
      } else {
        if (range.test(parsedUrl.hostname)) return false;
      }
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

// Use it
if (!isAllowedDomain(url)) {
  return new Response(
    JSON.stringify({ error: 'Domain not allowed' }),
    { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}
```

### ALDRIG

```typescript
// ❌ ALDRIG: Unprotected fetch
const { url } = await req.json();
const response = await fetch(url); // SSRF RISK!

// ❌ ALDRIG: No domain validation
// ❌ ALDRIG: Allowing internal IPs (localhost, 192.168.x.x, etc)
```

## ⏱️ Rate Limiting

**REQUIREMENT:** Implementera rate limiting för publika endpoints.

### Implementation

```typescript
// ✅ ALLTID: Rate limiting
const RATE_LIMITS = {
  requests_per_minute: 60,
  requests_per_hour: 1000
};

// Simplified in-memory rate limiting
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const userLimit = rateLimitStore.get(userId);
  
  if (!userLimit || now > userLimit.resetTime) {
    rateLimitStore.set(userId, { 
      count: 1, 
      resetTime: now + 60000 // 1 minute
    });
    return true;
  }
  
  if (userLimit.count >= RATE_LIMITS.requests_per_minute) {
    return false; // Rate limited
  }
  
  userLimit.count++;
  return true;
}

// Use it
if (!checkRateLimit(user.id)) {
  return new Response(
    JSON.stringify({ error: 'Rate limit exceeded. Max 60 requests/minute' }),
    { 
      status: 429, 
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json',
        'Retry-After': '60'
      } 
    }
  );
}

// PRODUCTION: Use Redis or database for distributed rate limiting
```

## 🛑 Error Handling

**REQUIREMENT:** Säker error handling utan att läcka känslig data.

### Implementation

```typescript
// ✅ ALLTID: Säker error handling
try {
  const response = await fetch(url);
  const data = await response.json();
  return new Response(JSON.stringify(data), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
  
} catch (error) {
  // Log error for debugging
  const message = error instanceof Error ? error.message : 'Unknown error';
  console.error('Operation failed:', {
    message,
    timestamp: new Date().toISOString(),
    // DON'T log: user data, request body, auth tokens
  });
  
  // Return generic error to client
  return new Response(
    JSON.stringify({ error: 'Operation failed' }),
    { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    }
  );
}
```

### ALDRIG

```typescript
// ❌ ALDRIG: Leak sensitive data in errors
catch (error) {
  console.log('User data:', user); // Reveals sensitive info
  console.log('Request:', req.body); // May contain secrets
  return new Response(JSON.stringify({ error: error.message })); // Too detailed
}

// ❌ ALDRIG: Send internal errors to client
return new Response(JSON.stringify({ 
  error: 'Database connection failed at 192.168.1.100:5432'
}));
```

## 🔄 Timeout Protection

**REQUIREMENT:** Alla fetch calls MÅSTE ha timeout.

```typescript
// ✅ ALLTID: Timeout för fetch
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 seconds

try {
  const response = await fetch(url, {
    signal: controller.signal,
    headers: { 'User-Agent': 'Receptapp/1.0' }
  });
  clearTimeout(timeoutId);
  return response;
  
} catch (error) {
  clearTimeout(timeoutId);
  if (error instanceof DOMException && error.name === 'AbortError') {
    throw new Error('Request timeout after 10 seconds');
  }
  throw error;
}
```

## 🔐 CORS Headers

**REQUIREMENT:** Korrekt CORS konfiguration.

```typescript
// ✅ ALLTID: CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS'
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 204,
      headers: corsHeaders 
    });
  }
  
  // ... rest of function
});
```

## 📋 Security Checklist

Innan du deployerar en Edge Function:

- [ ] **Authentication** - Kräver autentisering via `supabase.auth.getUser()`
- [ ] **Input Validation** - Alla parameters valideras
- [ ] **Type Safety** - Typ-checked input (string, number, object)
- [ ] **Format Validation** - URL format, email format, etc
- [ ] **Range/Length** - Acceptable sizes och längder
- [ ] **SSRF Protection** - Domain whitelist för fetch calls
- [ ] **Private IPs Blocked** - Localhost och internal networks blockerade
- [ ] **Rate Limiting** - Implementerat för publika endpoints
- [ ] **Timeout** - Alla fetch calls har timeout (10s rekommenderat)
- [ ] **Error Handling** - Generiska error messages, ingen känslig data
- [ ] **Logging** - Säker logging utan secrets
- [ ] **CORS** - Korrekt konfigurerat
- [ ] **Environment** - Secrets i .env, inte hardcoded
- [ ] **Security Check** - `npm run security-check` passar
- [ ] **Code Review** - Security Auditor Agent har granskat

## 🚀 Template Usage

Använd alltid templaten:

```bash
npm run edge-function:new my-function
```

Templaten inkluderar redan:
- ✅ Authentication boilerplate
- ✅ Input validation helpers
- ✅ SSRF protection
- ✅ Rate limiting
- ✅ Error handling
- ✅ Timeout protection
- ✅ Logging utan secrets

---

**Version:** 1.0.0  
**Last updated:** 2025-10-22  
**Maintained by:** Security Team
