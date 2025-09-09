# 🎨 Customization Guide

## 🛠️ **Project-Specific Anpassningar**

Toolkit är flexibel och kan anpassas för olika projekttyper och team-preferenser.

---

## 📁 **File Structure Customization**

### **Custom Scripts Location:**
```bash
# Default: scripts/
# Alternativ: tools/, automation/, .dev-tools/

# Uppdatera i package.json:
"validate-smart": "node tools/smart-jsx-validator.js"
```

### **Custom .cursor Directory:**
```bash
# Default: .cursor/
# Alternativ: .automation/, .dev-automation/

# Uppdatera scripts för ny path
```

---

## ⚙️ **Validation Customization**

### **File Exclusions:**
Editera `scripts/smart-jsx-validator.js`:

```javascript
// Lägg till project-specifika exclusions
const excludePatterns = [
  'src/generated/',           // Generated code
  'src/vendor/',             // Third-party code
  'src/legacy/',             // Legacy components
  '**/*.stories.tsx',        // Storybook files
  '**/*.test.tsx'            // Test files
];

// I validateReactComponents method:
const filesToValidate = componentFiles.filter(file => {
  return !excludePatterns.some(pattern => 
    file.includes(pattern.replace('**/', ''))
  );
});
```

### **Custom Build Command:**
Uppdatera `package.json` för ditt build system:

```json
{
  "scripts": {
    "build:check": "webpack --mode=development",  // Webpack
    "build:check": "rollup -c --environment NODE_ENV:development",  // Rollup
    "build:check": "next build",  // Next.js
    "build:check": "nuxt build"   // Nuxt
  }
}
```

---

## 🤖 **Agent Customization**

### **File Watching Customization:**
Editera `.cursor/jsx-repair-agent.js`:

```javascript
// Anpassa övervakade filer för ditt projekt
const criticalFiles = [
  'src/pages/Dashboard.tsx',      // Default
  'src/components/App.tsx',       // Din main app
  'src/views/MainView.vue',       // Vue projects
  'src/containers/AppContainer.jsx'  // Different architecture
];

// Anpassa polling interval
const POLLING_INTERVAL = 3000;  // 3 sekunder (default: 5000)
```

### **Notification Customization:**
```javascript
// Custom notification messages
const notifications = {
  error: "🚨 JSX Error i {file}",
  warning: "⚠️ JSX Warning i {file}", 
  success: "✅ JSX OK i {file}"
};

// Custom notification sounds (macOS)
const playNotificationSound = (type) => {
  const sounds = {
    error: 'Basso',
    warning: 'Ping', 
    success: 'Glass'
  };
  execSync(`afplay /System/Library/Sounds/${sounds[type]}.aiff`);
};
```

---

## 🎯 **Team Customization**

### **Shared Config File:**
Skapa `.cursor/team-config.json`:

```json
{
  "team": {
    "name": "Frontend Team",
    "aiUsageBudget": 50.00,
    "sharedValidation": true,
    "notificationChannel": "#dev-alerts"
  },
  "validation": {
    "strictMode": true,
    "performanceMode": false,
    "customRules": ["no-console", "jsx-a11y"]
  },
  "integrations": {
    "slack": {
      "webhook": "https://hooks.slack.com/...",
      "enabled": false
    },
    "teams": {
      "webhook": "https://outlook.office.com/...",
      "enabled": false
    }
  }
}
```

### **Role-Based Configuration:**
```javascript
// I jsx-repair-agent.js
const getUserRole = () => {
  const gitUser = execSync('git config user.email', {encoding: 'utf8'}).trim();
  
  const roles = {
    'senior@company.com': 'admin',
    'junior@company.com': 'developer',
    'lead@company.com': 'lead'
  };
  
  return roles[gitUser] || 'developer';
};

// Anpassa behavior baserat på roll
const getValidationLevel = (role) => {
  const levels = {
    admin: 'minimal',      // Trust senior devs
    lead: 'standard',      // Balanced validation
    developer: 'strict'    // Full validation for juniors
  };
  return levels[role];
};
```

---

## 🔌 **Framework-Specific Anpassningar**

### **Next.js Projects:**
```json
// package.json additions
{
  "scripts": {
    "build:check": "next build",
    "type-check": "tsc --noEmit --incremental false",
    "validate-smart": "node scripts/smart-jsx-validator.js --nextjs"
  }
}
```

### **Vue.js Projects:**
```javascript
// smart-jsx-validator.js modifications
const vueFiles = await glob('src/**/*.{vue,jsx,tsx}', { cwd: projectRoot });

// Add Vue-specific validation
checkVueTemplates(content, filePath);
```

### **React Native Projects:**
```json
{
  "scripts": {
    "build:check": "react-native bundle --dev",
    "validate-smart": "node scripts/smart-jsx-validator.js --react-native"
  }
}
```

---

## 🎨 **VS Code Customization**

### **Custom Keybindings:**
Lägg till i `.vscode/keybindings.json`:

```json
[
  {
    "key": "ctrl+shift+v",
    "command": "workbench.action.tasks.runTask",
    "args": "Smart JSX Validation"
  },
  {
    "key": "ctrl+shift+a",
    "command": "workbench.action.tasks.runTask", 
    "args": "Start JSX Repair Agent"
  },
  {
    "key": "ctrl+shift+l",
    "command": "workbench.action.tasks.runTask",
    "args": "Prepare for Loveable.dev"
  }
]
```

### **Custom Status Bar:**
Lägg till VS Code extension integration:

```javascript
// .vscode/settings.json
{
  "files.associations": {
    "*.jsx-config": "json"
  },
  "editor.codeActionsOnSave": {
    "source.fixAll.jsx-validator": true
  }
}
```

---

## 💰 **Cost Control Customization**

### **Budget Alerts:**
```javascript
// I jsx-repair-agent.js
const BUDGET_LIMITS = {
  daily: 2.00,
  weekly: 10.00,
  monthly: 30.00
};

const checkBudget = () => {
  const usage = getCurrentUsage();
  if (usage.daily > BUDGET_LIMITS.daily * 0.8) {
    sendAlert('Daily budget warning: 80% used');
  }
};
```

### **AI Provider Customization:**
```javascript
// Byt från Haiku till annat för specifika tasks
const AI_PROVIDERS = {
  simple: 'claude-haiku',      // Billig för enkla fixes
  complex: 'claude-sonnet',    // Dyrare för komplexa problem
  analysis: 'gpt-4-turbo'      // Specifika analysis tasks
};
```

---

## 🔄 **CI/CD Integration**

### **GitHub Actions:**
Skapa `.github/workflows/jsx-validation.yml`:

```yaml
name: JSX Validation
on: [push, pull_request]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: npm run validate-smart
      - run: npm run type-check
      - run: npm run build:check
```

### **GitLab CI:**
```yaml
# .gitlab-ci.yml
jsx-validation:
  stage: test
  script:
    - npm install
    - npm run validate-smart
    - npm run loveable:prepare
```

---

## 🏗️ **Architecture Customization**

### **Monorepo Support:**
```javascript
// smart-jsx-validator.js för monorepos
const packages = ['packages/ui', 'packages/app', 'packages/shared'];

packages.forEach(pkg => {
  const componentFiles = await glob(`${pkg}/src/**/*.{tsx,jsx}`);
  // Validate each package separately
});
```

### **Micro-frontends:**
```json
// package.json för shared validation
{
  "scripts": {
    "validate-all": "npm run validate-smart && npm run validate-shared",
    "validate-shared": "node scripts/validate-shared-components.js"
  }
}
```

---

## 📊 **Analytics Customization**

### **Usage Tracking:**
```javascript
// Lägg till i jsx-repair-agent.js
const analytics = {
  validationRuns: 0,
  errorsFound: 0,
  aiRepairsUsed: 0,
  costThisMonth: 0
};

const saveAnalytics = () => {
  fs.writeFileSync('.cursor/analytics.json', JSON.stringify(analytics));
};
```

### **Team Dashboard:**
```javascript
// Generera team report
const generateTeamReport = () => {
  const report = {
    totalProjects: getProjectCount(),
    averageCost: getAverageCost(),
    topIssues: getTopIssues(),
    teamEfficiency: calculateEfficiency()
  };
  
  // Send to team dashboard eller Slack
};
```

---

## 🎯 **Quick Customization Examples**

### **Mindre strikta validering:**
```javascript
// smart-jsx-validator.js
this.errors = []; // Disable all errors, endast warnings
```

### **Mer strikta validering:**
```javascript
// Lägg till extra checks
this.checkAccessibility(content, filePath);
this.checkPerformance(content, filePath);
this.checkSecurityPatterns(content, filePath);
```

### **Custom project structure:**
```bash
# För projekt med non-standard struktur
cp -r ~/Desktop/cursor-loveable-toolkit/* .
# Anpassa paths i alla scripts för din struktur
```

**Remember: Alla anpassningar bevaras när du uppdaterar toolkit!** ✅
