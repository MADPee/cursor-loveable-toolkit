# 🔒 Security Automation Guide

Denna guide visar hur du implementerar automatisk säkerhetskontroll i dina projekt för att förhindra säkerhetsbrister.

## 📋 Innehål

- [Översikt](#-Översikt)
- [Setup](#-Setup)
- [Security Validator](#-Security-Validator)
- [Best Practices](#-Best-Practices)
- [Integration med CI/CD](#-Integration-med-CICD)

## 🎯 Översikt

Den här toolkiten inkluderar:

1. **Security Validator** (`config-templates/security-validator.js`) - Automatisk säkerhetskontroll
2. **Edge Function Template** (`config-templates/edge-function-template.ts`) - Säker startpunkt
3. **Cursor Rules** (`config-templates/cursorrules-security.md`) - AI-agent regler
4. **Pre-commit Hooks** - Automatisk validering vid commits

## ⚡ Setup (5 minuter)

### Steg 1: Kopiera filer från denna repo

```bash
# Från cursor-loveable-toolkit
cp config-templates/security-validator.js /din-projekt/scripts/
cp config-templates/edge-function-template.ts /din-projekt/scripts/
cp config-templates/cursorrules-security.md /din-projekt/.cursorrules
```

### Steg 2: Lägg till npm scripts

```json
{
  "scripts": {
    "security-check": "node scripts/security-validator.js",
    "security-check:fix": "node scripts/security-validator.js --fix",
    "edge-function:new": "node scripts/create-edge-function.js"
  }
}
```

### Steg 3: Uppdatera pre-commit hook

```bash
# I .husky/pre-commit
echo "🔒 Running security checks..."
npm run security-check || exit 1
```

### Steg 4: Test

```bash
npm run security-check
```

## 🛡️ Security Validator

Validatorn utför följande kontroller automatiskt:

### Edge Function Checks

- ✅ **Authentication** - Alla Edge Functions kräver `supabase.auth.getUser()`
- ✅ **Input Validation** - Parameters valideras för typ, längd, format
- ✅ **CORS Headers** - Korrekt CORS konfiguration
- ✅ **SSRF Protection** - Domain whitelist för fetch calls
- ✅ **Rate Limiting** - Rate limiting på publika endpoints
- ✅ **Error Handling** - Ingen känslig data i felmeddelanden

### Database Security Checks

- ✅ **RLS Enabled** - Row Level Security på alla tabeller
- ✅ **User Roles** - Separata `user_roles` tabell med SECURITY DEFINER
- ✅ **No auth.users** - Ingen direkt referens till `auth.users`
- ✅ **Policies Tested** - Policies testat med olika användarroller

### Frontend Security Checks

- ✅ **XSS Prevention** - dangerouslySetInnerHTML utan DOMPurify
- ✅ **Client-side Validation** - Ingen rollvalidering för access control
- ✅ **Hardcoded Secrets** - Hittar potentiella API keys
- ✅ **Fetch Timeout** - Alla fetch calls har timeout

### Configuration Checks

- ✅ **JWT Verification** - verify_jwt inte disabled
- ✅ **Environment Variables** - Secrets i .env, inte hardcoded
- ✅ **Dependencies** - Zod och andra security libs finns

## 🚀 Användning

### Manuell validering

```bash
# Full check
npm run security-check

# Med fix-förslag
npm run security-check:fix
```

### Automatic validering vid commits

```bash
# Setup pre-commit hook
npx husky install
npx husky add .husky/pre-commit

# Sedan lägg till security check i hooket
echo "npm run security-check || exit 1" >> .husky/pre-commit

# Nu körs validering automatiskt
git commit -m "Your changes"
```

### Skapa ny Edge Function

```bash
# Snabbt skapa med säker template
npm run edge-function:new my-function

# Redigera: supabase/functions/my-function/index.ts
# Validera: npm run security-check
# Deploy: npx supabase functions deploy my-function
```

## 🔍 Exempel: Säker Edge Function

Med templaten får du:

```typescript
// ✅ Authentication ALLTID inkluderat
const { user, supabase } = await authenticateUser(req);

// ✅ Input validation
const url = validateString(body.url, 'URL', 2000);

// ✅ SSRF protection
const ALLOWED_DOMAINS = ['example.com'];
if (!validateUrl(url)) return forbidden();

// ✅ Rate limiting
if (!checkRateLimit(user.id)) return rateLimit();

// ✅ Secure fetch with timeout
const response = await secureFetch(url);

// ✅ Safe error handling
catch (error) {
  console.error('Operation failed:', error.message);
  return createErrorResponse('Operation failed', 500);
}
```

## 📚 Best Practices

Läs dessa filer för detaljerad vägledning:

1. **[EDGE_FUNCTION_SECURITY.md](./EDGE_FUNCTION_SECURITY.md)** - Edge Function best practices
2. **[SECURITY_CHECKLIST.md](../guides/SECURITY_CHECKLIST.md)** - Pre-deployment checklista
3. **[AI_AGENTS.md](../docs/AI_AGENTS.md)** - Security Auditor Agent guidelines

## 🔗 Integration med CI/CD

### GitHub Actions

```yaml
# .github/workflows/security.yml
name: Security Check

on: [push, pull_request]

jobs:
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - run: npm install
      - run: npm run security-check
```

### Pre-commit Hook

```bash
#!/bin/sh
echo "🔒 Running security validation..."
npm run security-check || {
  echo "❌ Security issues found"
  exit 1
}
```

## 🧪 Testing Security

### Testa RLS Policies

```typescript
test('user cannot access other users data', async () => {
  const user1Data = await supabaseAsUser1
    .from('recipes')
    .select('*')
    .eq('user_id', user2.id);
  
  expect(user1Data.error).toBeTruthy(); // Should be blocked by RLS
});
```

### Testa Edge Function Auth

```typescript
test('edge function requires authentication', async () => {
  const response = await fetch('/api/edge-function', {
    method: 'POST',
    body: JSON.stringify({ data: 'test' })
  });
  
  expect(response.status).toBe(401);
});
```

## ⚙️ Configuration

### Anpassa allowed domains

I `edge-function-template.ts`:

```typescript
const ALLOWED_DOMAINS = [
  'example.com',
  'api.example.com',
  'sub.domain.com'
];
```

### Anpassa rate limits

```typescript
const RATE_LIMITS = {
  requests_per_minute: 60,
  requests_per_hour: 1000
};
```

### Anpassa image size

```typescript
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10 MB
```

## 🆘 Troubleshooting

### Security validator hittade falskt positiva

Kontrollera:
- Är autentiseringen på andra platser?
- Är domain whitelisten konfigurerad?
- Finns rate limiting?

Kör med fix-förslag:
```bash
npm run security-check:fix
```

### Pre-commit hook kör inte

```bash
# Verifiera Husky installation
npm run prepare

# Gör hook körbar
chmod +x .husky/pre-commit

# Test manuellt
./.husky/pre-commit
```

## 📖 Dokumentation

- [EDGE_FUNCTION_SECURITY.md](./EDGE_FUNCTION_SECURITY.md) - Detaljerad guide
- [SECURITY_CHECKLIST.md](../guides/SECURITY_CHECKLIST.md) - Deployment checklist
- [AI_AGENTS.md](../../docs/AI_AGENTS.md) - Security Auditor guidelines

---

**Version:** 1.0.0  
**Last updated:** 2025-01-22  
**Maintained by:** Security Team
