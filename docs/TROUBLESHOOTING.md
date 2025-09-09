# 🔧 Troubleshooting Guide

## ❌ **Common Issues & Solutions**

### **1. "validate-smart" command not found**

**Problem:** NPM script not added to package.json

**Solution:**
```bash
# Re-run installer
node installer.js

# OR manually add to package.json:
"validate-smart": "node scripts/smart-jsx-validator.js"
```

---

### **2. "Module not found: glob/chokidar"**

**Problem:** Dependencies not installed

**Solution:**
```bash
npm install glob chokidar husky
```

---

### **3. TypeScript compilation fails**

**Problem:** TypeScript not available or misconfigured

**Solution:**
```bash
# Install TypeScript
npm install -D typescript

# Check tsconfig.json exists
# If not, create basic one:
npx tsc --init
```

---

### **4. Pre-commit hooks not working**

**Problem:** Husky not properly initialized

**Solution:**
```bash
# Reinstall husky
npx husky install
chmod +x .husky/pre-commit

# Verify hook content
cat .husky/pre-commit
```

---

### **5. JSX Agent won't start**

**Problem:** Path issues or permission denied

**Solution:**
```bash
# Check file exists
ls -la .cursor/jsx-repair-agent.js

# Fix permissions
chmod +x .cursor/*.js

# Test manually
node .cursor/jsx-repair-agent.js start
```

---

### **6. VS Code tasks not showing**

**Problem:** Tasks.json not in correct location

**Solution:**
```bash
# Ensure correct path
ls -la .vscode/tasks.json

# Reload VS Code
# Cmd+Shift+P → "Reload Window"
```

---

### **7. Desktop notifications not working**

**Problem:** System permissions or OS compatibility

**Solution:**

**macOS:**
```bash
# Test notification manually
osascript -e 'display notification "Test" with title "Toolkit"'

# If fails, check System Preferences → Notifications
```

**Windows:**
- Enable notifications in Windows Settings
- Allow Node.js in notification settings

---

### **8. "Permission denied" errors**

**Problem:** Scripts missing execute permissions

**Solution:**
```bash
# Fix all script permissions
chmod +x scripts/*.js
chmod +x .cursor/*.js
chmod +x .husky/*
```

---

### **9. Build check fails**

**Problem:** Vite not configured or missing

**Solution:**
```bash
# For Vite projects (default)
npm install -D vite

# For other build tools, update package.json:
"build:check": "npm run build"
```

---

### **10. Git hooks run but don't block commits**

**Problem:** Hook script doesn't exit with error code

**Solution:**
```bash
# Check hook content
cat .husky/pre-commit

# Should contain:
# npm run validate-smart || exit 1
```

---

## 🔍 **Diagnostic Commands**

### **Check System Health:**
```bash
# Verify all components
npm run validate-smart      # Core validation
npm run jsx-agent:status    # Agent status  
npm run type-check         # TypeScript
npm run build:check        # Build system
```

### **Check File Structure:**
```bash
# Verify toolkit files exist
ls -la scripts/smart-jsx-validator.js
ls -la .cursor/jsx-repair-agent.js
ls -la .cursor/auto-startup.js
ls -la .vscode/tasks.json
ls -la .husky/pre-commit
```

### **Test Individual Components:**
```bash
# Test validation directly
node scripts/smart-jsx-validator.js

# Test agent directly  
node .cursor/jsx-repair-agent.js status

# Test startup directly
node .cursor/auto-startup.js start
```

---

## 🆘 **Emergency Recovery**

### **Complete Reset:**
```bash
# 1. Remove toolkit files
rm -rf .cursor scripts/.cursor
rm -f .vscode/tasks.json
rm -f .husky/pre-commit

# 2. Reinstall from scratch
cp -r ~/Desktop/cursor-loveable-toolkit/* .
node installer.js

# 3. Verify installation
npm run dev:start
```

### **Minimal Recovery (if auto-installer fails):**
```bash
# 1. Copy only essential files
cp ~/Desktop/cursor-loveable-toolkit/scripts/smart-jsx-validator.js scripts/
cp ~/Desktop/cursor-loveable-toolkit/cursor-automation/jsx-repair-agent.js .cursor/

# 2. Add minimal package script
# In package.json add:
"validate-smart": "node scripts/smart-jsx-validator.js"

# 3. Test basic functionality
npm run validate-smart
```

---

## 📊 **Performance Issues**

### **Slow validation:**
```bash
# Check file count being validated
npm run validate-smart | grep "Files checked"

# If too many files, add exclusions to smart-jsx-validator.js
```

### **High CPU usage:**
```bash
# Check if multiple agents running
npm run jsx-agent:status

# Stop extra instances
npm run jsx-agent:stop
npm run dev:stop
```

### **Memory issues:**
```bash
# Limit file watching in jsx-repair-agent.js
# Reduce polling interval or watch fewer files
```

---

## 🌐 **Cross-Platform Specific**

### **macOS Issues:**
- Ensure Xcode command line tools: `xcode-select --install`
- For M1/M2 Macs: Use `arch -x86_64 npm install` if needed

### **Windows Issues:**
- Use PowerShell (not CMD) for better compatibility
- Ensure Git Bash is available for shell scripts
- Check Windows Defender isn't blocking scripts

### **Linux/WSL Issues:**
- Ensure Node.js permissions: `sudo chown -R $(whoami) ~/.npm`
- For WSL, ensure Windows integration is enabled

---

## 📞 **Getting Help**

### **Debug Information to Collect:**
```bash
# System info
node --version
npm --version
git --version

# Project info
cat package.json | grep -A 10 '"scripts"'
ls -la .cursor/ scripts/ .vscode/

# Error logs
npm run validate-smart 2>&1 | head -20
```

### **Common Solution Pattern:**
1. **Check file permissions** (`chmod +x`)
2. **Verify dependencies** (`npm install`)
3. **Test individual components** (run scripts directly)
4. **Check paths** (ensure files are in correct locations)
5. **Reset if needed** (reinstall toolkit)

**Most issues are resolved by re-running `node installer.js`** 🔧
