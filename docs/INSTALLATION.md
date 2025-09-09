# 📦 Installation Guide - Cursor+Loveable Toolkit

## 🎯 **Quick Installation (30 sekunder)**

### **För NYA projekt:**
```bash
# 1. Kopiera toolkit till ditt projekt
git clone https://github.com/MADPee/cursor-loveable-toolkit.git
cp -r cursor-loveable-toolkit/* .

# 2. Auto-setup
node installer.js

# 3. Start automation
npm run dev:start
```

### **För BEFINTLIGA projekt:**
```bash
# 1. Säker kopiering (skriv inte över befintliga filer)
git clone https://github.com/MADPee/cursor-loveable-toolkit.git
cp -r cursor-loveable-toolkit/* . --no-clobber

# 2. Merge setup
node installer.js --merge-existing

# 3. Aktivera
npm run dev:start
```

---

## 🔧 **Manual Installation**

### **Steg 1: Kopiera filer**
```bash
# Skapa directories
mkdir -p .cursor scripts .vscode

# Kopiera core files
cp ~/Desktop/cursor-loveable-toolkit/scripts/* scripts/
cp ~/Desktop/cursor-loveable-toolkit/cursor-automation/* .cursor/
cp ~/Desktop/cursor-loveable-toolkit/config-templates/vscode-tasks.json .vscode/tasks.json
cp ~/Desktop/cursor-loveable-toolkit/config-templates/pre-commit-hook.sh .husky/pre-commit
```

### **Steg 2: Installera dependencies**
```bash
npm install glob chokidar husky
```

### **Steg 3: Lägg till NPM scripts**
Merge följande till din `package.json`:
```json
{
  "scripts": {
    "validate-smart": "node scripts/smart-jsx-validator.js",
    "jsx-agent:start": "node .cursor/jsx-repair-agent.js start",
    "jsx-agent:status": "node .cursor/jsx-repair-agent.js status",
    "dev:start": "node .cursor/auto-startup.js start",
    "loveable:prepare": "npm run validate-smart && npm run type-check",
    "loveable:emergency": "git checkout HEAD~1 -- src/ && npm run validate-smart"
  }
}
```

### **Steg 4: Setup Git hooks**
```bash
npx husky install
chmod +x .husky/pre-commit
```

### **Steg 5: Testa installation**
```bash
npm run validate-smart    # Should run without errors
npm run dev:start        # Start automation
```

---

## 💻 **Cross-Platform Setup**

### **macOS (iMac + MacBook):**
```bash
# Toolkit synkar automatiskt via iCloud Desktop
# Samma kommandon fungerar på båda maskiner
npm run dev:start
```

### **Windows:**
```bash
# Copy toolkit från synkad mapp (OneDrive/Dropbox)
xcopy "C:\Users\%USERNAME%\Desktop\cursor-loveable-toolkit" . /E /I

# Kör installer
node installer.js
```

### **Linux/WSL:**
```bash
# Same as macOS
cp -r ~/Desktop/cursor-loveable-toolkit/* .
node installer.js
```

---

## 🎨 **VS Code Integration**

### **Auto-start på folder open:**
VS Code kommer automatiskt erbjuda att köra tasks när projektet öppnas.

### **Manual tasks:**
- `Cmd+Shift+P` → "Tasks: Run Task"
- Välj "Start JSX Repair Agent" eller "Smart JSX Validation"

### **Keyboard shortcuts:**
Lägg till i `.vscode/keybindings.json`:
```json
[
  {
    "key": "cmd+shift+l",
    "command": "workbench.action.tasks.runTask",
    "args": "Prepare for Loveable.dev"
  },
  {
    "key": "cmd+shift+j", 
    "command": "workbench.action.tasks.runTask",
    "args": "Smart JSX Validation"
  }
]
```

---

## 🔍 **Verification Checklist**

Efter installation, verifiera att allt fungerar:

### **✅ Core Functionality:**
```bash
npm run validate-smart     # Should pass
npm run type-check        # Should pass
npm run build:check       # Should pass
```

### **✅ Automation:**
```bash
npm run dev:start         # Should start agents
npm run jsx-agent:status  # Should show "active"
```

### **✅ Git Integration:**
```bash
git add . && git commit -m "test"  # Should run pre-commit validation
```

### **✅ Loveable.dev Ready:**
```bash
npm run loveable:prepare   # Should pass all checks
```

---

## ⚠️ **Common Issues**

### **"Module not found" errors:**
```bash
# Ensure you're in project root and dependencies are installed
npm install glob chokidar husky
```

### **"Permission denied" på scripts:**
```bash
chmod +x scripts/*.js
chmod +x .cursor/*.js
```

### **TypeScript not found:**
```bash
# Install TypeScript if not available
npm install -D typescript
```

### **Husky hooks not working:**
```bash
npx husky install
chmod +x .husky/pre-commit
```

---

## 🎯 **Success Indicators**

When properly installed, you should see:

1. **✅ Clean validation:** `npm run validate-smart` returns 0 errors
2. **✅ Background monitoring:** Agents start automatically
3. **✅ Pre-commit protection:** Git commits trigger validation
4. **✅ VS Code integration:** Tasks available in command palette
5. **✅ Desktop notifications:** System alerts for real issues

**Next step:** Start developing! The system now protects you automatically.
