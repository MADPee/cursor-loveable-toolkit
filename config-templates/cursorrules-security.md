# Cursor AI Rules - Receptapp Security-First Development

## 🔒 Security-First Development Rules

### Edge Functions Security (KRITISKT)

**ALL Edge Functions MÅSTE:**
- ✅ Kräva autentisering via `supabase.auth.getUser()`
- ✅ Validera input parameters
- ✅ Implementera CORS headers korrekt
- ✅ Ha error handling utan att läcka känslig data
- ✅ Logga utan att exponera secrets

**FORBIDDEN Patterns:**
```typescript
// ❌ ALDRIG: Oskyddade Edge Functions
serve(async (req) => {
  const { url } = await req.json();
  const response = await fetch(url); // SSRF RISK!
});

// ❌ ALDRIG: verify_jwt = false i config
// ❌ ALDRIG: Raw SQL från user input
// ❌ ALDRIG: Hardcoded secrets eller API keys
```

**REQUIRED Patterns:**
```typescript
// ✅ ALLTID: Autentisering i Edge Functions
const authHeader = req.headers.get('Authorization');
if (!authHeader) {
  return new Response(JSON.stringify({ error: 'Unauthorized' }), {
    status: 401,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_ANON_KEY')!,
  { global: { headers: { Authorization: authHeader } } }
);

const { data: { user }, error } = await supabase.auth.getUser();
if (error || !user) {
  return new Response(JSON.stringify({ error: 'Invalid token' }), {
    status: 401,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

// ✅ ALLTID: Domain whitelist för fetch
const ALLOWED_DOMAINS = [
  'ica.se', 'coop.se', 'koket.se', 'arla.se', 
  'tasteline.com', 'lindasbakskola.se'
];

function isAllowedDomain(url: string): boolean {
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
    
    return ALLOWED_DOMAINS.some(domain => 
      parsedUrl.hostname === domain || 
      parsedUrl.hostname.endsWith('.' + domain)
    );
  } catch {
    return false;
  }
}

if (!isAllowedDomain(url)) {
  return new Response(JSON.stringify({ error: 'Domain not allowed' }), {
    status: 403,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

// ✅ ALLTID: Size validation för bilder
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10 MB
if (imageData.length > MAX_IMAGE_SIZE) {
  return new Response(
    JSON.stringify({ error: 'Image too large. Maximum 10 MB allowed.' }),
    { status: 413, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

// ✅ ALLTID: Timeout för fetch calls
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

try {
  const response = await fetch(url, {
    signal: controller.signal,
    headers: { 'User-Agent': 'Receptapp/1.0' }
  });
} finally {
  clearTimeout(timeoutId);
}
```

### Database Security Rules

**RLS Policies MÅSTE:**
- ✅ Vara aktiverade på ALLA tabeller
- ✅ Använda `auth.uid()` för user-owned resources
- ✅ Använda `has_role()` function för admin access
- ✅ Testas med olika användarroller

**FORBIDDEN Database Patterns:**
```sql
-- ❌ ALDRIG: Direkt referens till auth.users
SELECT * FROM auth.users WHERE id = $1;

-- ❌ ALDRIG: Roller i profiles tabell
ALTER TABLE profiles ADD COLUMN role TEXT;

-- ❌ ALDRIG: RLS disabled
ALTER TABLE recipes DISABLE ROW LEVEL SECURITY;
```

**REQUIRED Database Patterns:**
```sql
-- ✅ ALLTID: RLS aktiverat
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;

-- ✅ ALLTID: User-owned resources
CREATE POLICY "users_select_own_recipes"
ON recipes FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- ✅ ALLTID: Separate user_roles tabell
CREATE TABLE user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  UNIQUE(user_id, role)
);

-- ✅ ALLTID: SECURITY DEFINER function
CREATE FUNCTION has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;
```

### Frontend Security Rules

**Input Validation MÅSTE:**
- ✅ Använda Zod för all form validation
- ✅ Sanitera HTML från externa källor
- ✅ Validera filtyper och storlekar
- ✅ Använda TypeScript strict mode

**FORBIDDEN Frontend Patterns:**
```typescript
// ❌ ALDRIG: dangerouslySetInnerHTML utan sanitering
<div dangerouslySetInnerHTML={{ __html: recipe.title }} />

// ❌ ALDRIG: Client-side rollvalidering för access control
if (localStorage.getItem('role') === 'admin') {
  // WRONG: Can be manipulated
}

// ❌ ALDRIG: Hardcoded secrets
const API_KEY = 'sk-1234567890abcdef';
```

**REQUIRED Frontend Patterns:**
```typescript
// ✅ ALLTID: Zod validation
const schema = z.object({
  title: z.string().min(1).max(200),
  ingredients: z.array(z.string()).min(1),
  instructions: z.string().min(10)
});

// ✅ ALLTID: HTML sanitering
import DOMPurify from 'dompurify';
<div dangerouslySetInnerHTML={{ 
  __html: DOMPurify.sanitize(recipe.title) 
}} />

// ✅ ALLTID: Client-side roll check för UI display only
const { data } = await supabase
  .from('user_roles')
  .select('role')
  .eq('user_id', user.id)
  .single();

const isAdmin = data?.role === 'admin';
{isAdmin && <AdminPanel />}
```

### Security Auditor Agent Guidelines

**Security Auditor Agent har VETO-RÄTT över alla säkerhetsrelaterade beslut.**

**När Security Auditor Agent ska konsulteras:**
- ✅ Nya Edge Functions skapas
- ✅ RLS policies ändras eller läggs till
- ✅ Autentiseringsflöden modifieras
- ✅ Input validation ändras
- ✅ Rollhantering implementeras

**Security Auditor Agent checklist:**
- [ ] Edge Function har autentisering
- [ ] Input validation finns
- [ ] CORS headers korrekt
- [ ] Error handling säker
- [ ] RLS policies testade
- [ ] Rollhantering säker
- [ ] Inga secrets exponerade

### Error Handling & Logging

**Säker error handling:**
```typescript
// ✅ ALLTID: Säker error handling
try {
  // Operation
} catch (error) {
  console.error('Operation failed:', error.message); // Logga bara message
  return new Response(
    JSON.stringify({ error: 'Operation failed' }), // Generisk felmeddelande
    { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

// ❌ ALDRIG: Logga känslig data
console.log('User data:', user); // Kan innehålla secrets
console.log('Request body:', req.body); // Kan innehålla secrets
```

### Rate Limiting & Resource Protection

**Rate limiting MÅSTE övervägas för:**
- ✅ Publika endpoints
- ✅ Bilduppladdningar
- ✅ API-anrop till externa tjänster
- ✅ Databasoperationer

**Resource protection patterns:**
```typescript
// ✅ ALLTID: Rate limiting för bilder
const MAX_UPLOADS_PER_HOUR = 50;
const userUploads = await getUploadCount(user.id, '1 hour');
if (userUploads >= MAX_UPLOADS_PER_HOUR) {
  return new Response(
    JSON.stringify({ error: 'Rate limit exceeded' }),
    { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}
```

## 🎯 Development Workflow

### Pre-Commit Security Checks

**Alla commits MÅSTE passera:**
1. TypeScript compilation
2. ESLint security rules
3. Security validator script
4. Build test

### Security Review Process

**För nya features:**
1. Implementera enligt säkerhetsregler ovan
2. Kör `npm run security-check`
3. Security Auditor Agent granskar
4. Testa med olika användarroller
5. Deploy endast efter godkännande

### Emergency Response

**Vid säkerhetsincident:**
1. Disable affected functionality immediately
2. Review logs for exploitation attempts
3. Patch vulnerability
4. Force password reset if credentials compromised
5. Notify affected users
6. Document in security advisory

## 📚 References

- **Security Guide:** `docs/guides/SECURITY.md`
- **Technical Documentation:** `docs/TECHNICAL.md`
- **ADR-002:** `docs/adr/002-separate-user-roles-table.md`
- **AI Agents:** `docs/AI_AGENTS.md`

## 🚨 Critical Reminders

1. **Security Auditor Agent har veto-rätt** - Respektera säkerhetsgranskningar
2. **Edge Functions utan autentisering = BLOCKED** - Aldrig deployera
3. **RLS på alla tabeller** - Ingen undantag
4. **Input validation alltid** - Förhindra injection attacks
5. **Secrets i environment variables** - Aldrig hardcoded
6. **Rate limiting för publika endpoints** - Förhindra abuse

---

**Säkerhet först, alltid. Inga undantag.**
