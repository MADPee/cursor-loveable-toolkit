# ✅ Security Checklist

Använd denna checklista innan du deployar nya features.

## 🔒 Pre-Deployment

### Code Review

- [ ] **Security Validator** - `npm run security-check` passar utan errors
- [ ] **Fix-förslag** - `npm run security-check:fix` har körts och reviewats
- [ ] **Manual Inspection** - Kod har granskats för säkerhetsproblem
- [ ] **Peer Review** - Minst en annan utvecklare har granskat koden

### Edge Functions

- [ ] **Authentication** - Alla Edge Functions kräver autentisering
- [ ] **Input Validation** - Alla parameters valideras (typ, längd, format)
- [ ] **SSRF Protection** - Domain whitelist implementerad för fetch calls
- [ ] **Rate Limiting** - Rate limiting på publika endpoints
- [ ] **Timeout** - Alla fetch calls har timeout (10s)
- [ ] **Error Handling** - Generiska error messages, ingen känslig data
- [ ] **Logging** - Säker logging utan API keys/passwords
- [ ] **CORS** - Korrekt konfigurerat
- [ ] **Environment** - Secrets i .env, inte hardcoded

### Database

- [ ] **RLS Enabled** - Row Level Security på alla tabeller
- [ ] **Policies Tested** - Policys testad med olika användarroller
- [ ] **No auth.users** - Ingen direkt referens till `auth.users` tabell
- [ ] **user_roles** - Separate user_roles tabell med SECURITY DEFINER
- [ ] **Foreign Keys** - On delete CASCADE konfigurerat korrekt
- [ ] **Indexes** - Indexes på user_id columns för performance

### Frontend

- [ ] **XSS Prevention** - dangerouslySetInnerHTML använd med DOMPurify
- [ ] **Role Validation** - Rollvalidering endast för UI display
- [ ] **Input Validation** - Alla forms har Zod validation
- [ ] **Secrets** - Inga API keys i frontend code
- [ ] **Type Safety** - Ingen `any` types (TypeScript strict)
- [ ] **Dependency Check** - Inga known security vulnerabilities

### Configuration

- [ ] **JWT Verification** - verify_jwt inte disabled i config
- [ ] **Environment Variables** - .env.example dokumenterad
- [ ] **Secrets Management** - Alla secrets i environment variables
- [ ] **API Keys** - API keys rotated enligt schema

## 🧪 Testing

### Unit Tests

- [ ] **Auth Functions** - Authentication logik testad
- [ ] **Validators** - Input validators testad med edge cases
- [ ] **Utilities** - Utility functions har god test coverage
- [ ] **Security Functions** - Rate limiting, domain checks testad

### Integration Tests

- [ ] **RLS Policies** - Testat att RLS policies blockerar unauthorized access
- [ ] **Edge Functions** - Edge functions testad med auth och input validation
- [ ] **Database** - CRUD operations testad
- [ ] **Error Handling** - Error paths testad

### Manual Testing

- [ ] **Access Control** - Försök accessa andra användares data (ska failed)
- [ ] **Input Validation** - Försök submit invalid input (ska rejected)
- [ ] **SSRF** - Försök fetch från privat IP (ska blocked)
- [ ] **Rate Limiting** - Försök hammer endpoint (ska throttled)

## 🔐 Security Review

### Code Patterns

- [ ] **No SQL Injection** - Ingen raw SQL från user input
- [ ] **No XSS** - Ingen unescaped user content i HTML
- [ ] **No CSRF** - CSRF tokens där applicable (Supabase handles)
- [ ] **No Privilege Escalation** - Rollvalidering är server-side
- [ ] **No Information Leak** - Error messages är generiska

### Dependencies

- [ ] **Vulnerabilities** - `npm audit` passar utan errors
- [ ] **Outdated** - Dependencies är up-to-date
- [ ] **Licenses** - All licenses OK för commercial use

## 📋 Documentation

- [ ] **Security Guide** - Uppdaterad med ny feature
- [ ] **API Documentation** - Security requirements documented
- [ ] **Edge Function** - Säkerhetskontroller dokumenterade
- [ ] **README** - Setup instruktioner klar
- [ ] **Changelog** - Entry added för release notes

## 🚀 Deployment

### Pre-Deployment

- [ ] **Backup** - Database backup taget
- [ ] **Migration** - Database migrations testad locally
- [ ] **Build** - `npm run build` lyckas
- [ ] **Environment** - Production .env konfigurerat
- [ ] **Secrets** - Alla secrets i place

### Deployment

- [ ] **Health Check** - Endpoint responding
- [ ] **Logging** - Logs monitored för errors
- [ ] **Performance** - No performance degradation
- [ ] **Users** - Users can access without issues

### Post-Deployment

- [ ] **Monitoring** - Error rates normal
- [ ] **Security** - No suspicious activity
- [ ] **Documentation** - Runbook updated
- [ ] **Incident Plan** - Team aware of rollback procedure

## 🚨 Security Incident Response

Om du hittar en säkerhetsbrist:

1. **Immediate** (0-15 min)
   - [ ] Disable affected functionality
   - [ ] Document issue
   - [ ] Notify team

2. **Assessment** (15-60 min)
   - [ ] Review logs for exploitation
   - [ ] Assess scope and impact
   - [ ] Check if data compromised

3. **Containment** (1-4 hours)
   - [ ] Patch vulnerability
   - [ ] Update security measures
   - [ ] Test fix thoroughly

4. **Recovery** (4-24 hours)
   - [ ] Deploy fix to production
   - [ ] Monitor for additional issues
   - [ ] Force password reset if needed

5. **Post-Incident** (1-7 days)
   - [ ] Notify affected users
   - [ ] Document lessons learned
   - [ ] Update security procedures
   - [ ] Conduct post-mortem

## 📞 Security Contacts

- **Security Lead:** [Add contact]
- **DevOps Team:** [Add contact]
- **On-call:** [Add contact info]

## 🔗 Related Documents

- [SECURITY_AUTOMATION.md](../docs/SECURITY_AUTOMATION.md)
- [EDGE_FUNCTION_SECURITY.md](../docs/EDGE_FUNCTION_SECURITY.md)
- [.cursorrules-security.md](../config-templates/cursorrules-security.md)

---

**Version:** 1.0.0  
**Last updated:** 2025-10-22  
**Maintained by:** Security Team
