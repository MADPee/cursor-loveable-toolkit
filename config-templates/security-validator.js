#!/usr/bin/env node

/**
 * Security Validator Script
 * Automatisk säkerhetskontroll för Receptapp
 * 
 * Kontrollerar:
 * - Edge Functions autentisering
 * - RLS policies
 * - Input validation
 * - Säkerhetsmönster i kod
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { join, extname } from 'path';
import { glob } from 'glob';

// ANSI colors för output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

class SecurityValidator {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.fixes = [];
    this.fixMode = process.argv.includes('--fix');
  }

  log(message, type = 'info') {
    const prefix = {
      error: `${colors.red}❌`,
      warning: `${colors.yellow}⚠️`,
      success: `${colors.green}✅`,
      info: `${colors.blue}ℹ️`
    }[type];
    
    console.log(`${prefix} ${message}${colors.reset}`);
  }

  async validate() {
    this.log('🔒 Starting security validation...', 'info');
    
    try {
      await this.validateEdgeFunctions();
      await this.validateDatabaseSecurity();
      await this.validateFrontendSecurity();
      await this.validateConfigFiles();
      
      this.printSummary();
      
      if (this.errors.length > 0) {
        process.exit(1);
      }
      
    } catch (error) {
      this.log(`Validation failed: ${error.message}`, 'error');
      process.exit(1);
    }
  }

  async validateEdgeFunctions() {
    this.log('Checking Edge Functions security...', 'info');
    
    const edgeFunctions = await glob('supabase/functions/**/index.ts');
    
    for (const file of edgeFunctions) {
      const content = readFileSync(file, 'utf8');
      const functionName = file.split('/')[2];
      
      // Check 1: Authentication
      if (!content.includes('supabase.auth.getUser()')) {
        this.errors.push({
          file,
          line: this.findLineNumber(content, 'serve(async'),
          message: `Edge Function '${functionName}' lacks authentication check`,
          fix: this.generateAuthFix()
        });
      }
      
      // Check 2: CORS headers
      if (!content.includes('corsHeaders') && !content.includes('Access-Control-Allow-Origin')) {
        this.warnings.push({
          file,
          message: `Edge Function '${functionName}' may lack proper CORS headers`,
          fix: this.generateCorsFix()
        });
      }
      
      // Check 3: Input validation
      if (content.includes('await req.json()') && !content.includes('if (!') && !content.includes('throw new Error')) {
        this.warnings.push({
          file,
          message: `Edge Function '${functionName}' may lack input validation`,
          fix: this.generateInputValidationFix()
        });
      }
      
      // Check 4: Error handling
      if (content.includes('console.log') && content.includes('req.body')) {
        this.errors.push({
          file,
          message: `Edge Function '${functionName}' may log sensitive data`,
          fix: 'Remove or sanitize logging of request body'
        });
      }
      
      // Check 5: SSRF protection for fetch calls
      if (content.includes('fetch(') && !content.includes('ALLOWED_DOMAINS') && !content.includes('isAllowedDomain')) {
        this.errors.push({
          file,
          message: `Edge Function '${functionName}' has unprotected fetch calls (SSRF risk)`,
          fix: this.generateSSRFProtectionFix()
        });
      }
      
      // Check 6: Size validation for images
      if (content.includes('imageBase64') && !content.includes('MAX_IMAGE_SIZE') && !content.includes('length >')) {
        this.warnings.push({
          file,
          message: `Edge Function '${functionName}' lacks image size validation`,
          fix: this.generateSizeValidationFix()
        });
      }
    }
  }

  async validateDatabaseSecurity() {
    this.log('Checking database security...', 'info');
    
    // Check migration files
    const migrations = await glob('supabase/migrations/*.sql');
    
    for (const file of migrations) {
      const content = readFileSync(file, 'utf8');
      
      // Check RLS policies
      const tables = content.match(/CREATE TABLE\s+(\w+)/g);
      if (tables) {
        for (const tableMatch of tables) {
          const tableName = tableMatch.replace('CREATE TABLE ', '');
          if (!content.includes(`ALTER TABLE ${tableName} ENABLE ROW LEVEL SECURITY`)) {
            this.warnings.push({
              file,
              message: `Table '${tableName}' may lack RLS policies`,
              fix: `Add: ALTER TABLE ${tableName} ENABLE ROW LEVEL SECURITY;`
            });
          }
        }
      }
      
      // Check for direct auth.users references
      if (content.includes('auth.users') && !content.includes('REFERENCES auth.users')) {
        this.errors.push({
          file,
          message: 'Direct reference to auth.users table found',
          fix: 'Use user_roles table instead of direct auth.users access'
        });
      }
      
      // Check for user_roles table
      if (content.includes('CREATE TABLE') && !content.includes('user_roles')) {
        this.warnings.push({
          file,
          message: 'user_roles table not found - role management may be insecure',
          fix: 'Create user_roles table with SECURITY DEFINER function'
        });
      }
    }
  }

  async validateFrontendSecurity() {
    this.log('Checking frontend security...', 'info');
    
    const frontendFiles = await glob('src/**/*.{ts,tsx}');
    
    for (const file of frontendFiles) {
      const content = readFileSync(file, 'utf8');
      
      // Check for dangerouslySetInnerHTML without sanitization
      if (content.includes('dangerouslySetInnerHTML') && !content.includes('DOMPurify')) {
        this.errors.push({
          file,
          message: 'dangerouslySetInnerHTML used without sanitization (XSS risk)',
          fix: 'Import DOMPurify and sanitize HTML content'
        });
      }
      
      // Check for hardcoded secrets
      const secretPatterns = [
        /sk-[a-zA-Z0-9]{20,}/,
        /pk_[a-zA-Z0-9]{20,}/,
        /[a-zA-Z0-9]{32,}/g
      ];
      
      for (const pattern of secretPatterns) {
        const matches = content.match(pattern);
        if (matches) {
          this.errors.push({
            file,
            message: 'Potential hardcoded secret found',
            fix: 'Move to environment variables'
          });
        }
      }
      
      // Check for client-side role validation for access control
      if (content.includes('localStorage.getItem(\'role\')') || content.includes('sessionStorage.getItem(\'role\')')) {
        this.warnings.push({
          file,
          message: 'Client-side role validation detected - use server-side validation for access control',
          fix: 'Use server-side role validation via RLS policies'
        });
      }
      
      // Check for fetch without timeout
      if (content.includes('fetch(') && !content.includes('AbortController') && !content.includes('signal:')) {
        this.warnings.push({
          file,
          message: 'fetch() call without timeout detected',
          fix: 'Add AbortController with timeout for fetch calls'
        });
      }
    }
  }

  async validateConfigFiles() {
    this.log('Checking configuration files...', 'info');
    
    // Check supabase config
    const configFile = 'supabase/config.toml';
    try {
      const content = readFileSync(configFile, 'utf8');
      
      if (content.includes('verify_jwt = false')) {
        this.errors.push({
          file: configFile,
          message: 'JWT verification disabled in config',
          fix: 'Remove verify_jwt = false or set to true'
        });
      }
    } catch (error) {
      // Config file doesn't exist, that's okay
    }
    
    // Check package.json for security-related dependencies
    const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));
    
    if (!packageJson.dependencies?.zod && !packageJson.devDependencies?.zod) {
      this.warnings.push({
        file: 'package.json',
        message: 'Zod validation library not found',
        fix: 'Add zod for runtime validation: npm install zod'
      });
    }
  }

  findLineNumber(content, searchText) {
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes(searchText)) {
        return i + 1;
      }
    }
    return 1;
  }

  generateAuthFix() {
    return `// Add authentication check
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
}`;
  }

  generateCorsFix() {
    return `// Add CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};`;
  }

  generateInputValidationFix() {
    return `// Add input validation
const { param } = await req.json();

if (!param || typeof param !== 'string') {
  return new Response(JSON.stringify({ error: 'Invalid parameter' }), {
    status: 400,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}`;
  }

  generateSSRFProtectionFix() {
    return `// Add SSRF protection
const ALLOWED_DOMAINS = ['ica.se', 'coop.se', 'koket.se', 'arla.se', 'tasteline.com'];

function isAllowedDomain(url: string): boolean {
  try {
    const parsedUrl = new URL(url);
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
}`;
  }

  generateSizeValidationFix() {
    return `// Add size validation
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10 MB

if (imageData.length > MAX_IMAGE_SIZE) {
  return new Response(
    JSON.stringify({ error: 'Image too large. Maximum 10 MB allowed.' }),
    { status: 413, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}`;
  }

  printSummary() {
    console.log('\n' + '='.repeat(60));
    console.log(`${colors.bold}🔒 Security Validation Summary${colors.reset}`);
    console.log('='.repeat(60));
    
    if (this.errors.length > 0) {
      console.log(`\n${colors.red}${colors.bold}❌ ERRORS (${this.errors.length})${colors.reset}`);
      this.errors.forEach((error, index) => {
        console.log(`\n${index + 1}. ${colors.red}${error.file}${colors.reset}`);
        console.log(`   ${error.message}`);
        if (this.fixMode && error.fix) {
          console.log(`   ${colors.yellow}Fix:${colors.reset} ${error.fix}`);
        }
      });
    }
    
    if (this.warnings.length > 0) {
      console.log(`\n${colors.yellow}${colors.bold}⚠️  WARNINGS (${this.warnings.length})${colors.reset}`);
      this.warnings.forEach((warning, index) => {
        console.log(`\n${index + 1}. ${colors.yellow}${warning.file}${colors.reset}`);
        console.log(`   ${warning.message}`);
        if (this.fixMode && warning.fix) {
          console.log(`   ${colors.yellow}Fix:${colors.reset} ${warning.fix}`);
        }
      });
    }
    
    if (this.errors.length === 0 && this.warnings.length === 0) {
      console.log(`\n${colors.green}${colors.bold}✅ All security checks passed!${colors.reset}`);
    }
    
    console.log('\n' + '='.repeat(60));
    
    if (this.errors.length > 0) {
      console.log(`\n${colors.red}Security validation failed with ${this.errors.length} errors.${colors.reset}`);
      console.log(`Run with --fix flag to see suggested fixes.`);
    } else if (this.warnings.length > 0) {
      console.log(`\n${colors.yellow}Security validation passed with ${this.warnings.length} warnings.${colors.reset}`);
      console.log(`Consider addressing warnings for better security.`);
    } else {
      console.log(`\n${colors.green}Security validation passed! 🎉${colors.reset}`);
    }
  }
}

// Run validation
const validator = new SecurityValidator();
validator.validate().catch(console.error);
