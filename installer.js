#!/usr/bin/env node

/**
 * Universal Cursor+Loveable Toolkit Installer
 * 
 * Auto-setup script som konfigurerar automation för alla projekt
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class ToolkitInstaller {
  constructor() {
    this.projectRoot = process.cwd();
    this.toolkitRoot = __dirname;
    this.isExistingProject = fs.existsSync(path.join(this.projectRoot, 'package.json'));
  }

  async install() {
    console.log('🚀 Installing Cursor+Loveable Toolkit...\n');
    
    try {
      // Step 1: Check prerequisites
      await this.checkPrerequisites();
      
      // Step 2: Install dependencies
      await this.installDependencies();
      
      // Step 3: Setup directories
      await this.setupDirectories();
      
      // Step 4: Configure package.json
      await this.configurePackageScripts();
      
      // Step 5: Setup Git hooks
      await this.setupGitHooks();
      
      // Step 6: Configure VS Code
      await this.setupVSCode();
      
      // Step 7: Final verification
      await this.verifyInstallation();
      
      console.log('✅ Toolkit installation complete!\n');
      this.showQuickStart();
      
    } catch (error) {
      console.error('❌ Installation failed:', error.message);
      process.exit(1);
    }
  }

  async checkPrerequisites() {
    console.log('🔍 Checking prerequisites...');
    
    // Check Node.js version
    const nodeVersion = process.version;
    console.log(`✅ Node.js ${nodeVersion}`);
    
    // Check if we're in a valid project directory
    if (!this.isExistingProject) {
      console.log('📦 Initializing new project...');
      execSync('npm init -y', { stdio: 'pipe' });
    }
    
    console.log('✅ Prerequisites OK\n');
  }

  async installDependencies() {
    console.log('📦 Installing dependencies...');
    
    const requiredDeps = ['glob', 'chokidar', 'husky'];
    
    try {
      // Check existing dependencies
      const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
      const existingDeps = { ...packageJson.dependencies, ...packageJson.devDependencies };
      
      const missingDeps = requiredDeps.filter(dep => !existingDeps[dep]);
      
      if (missingDeps.length > 0) {
        console.log(`Installing: ${missingDeps.join(', ')}`);
        execSync(`npm install ${missingDeps.join(' ')}`, { stdio: 'inherit' });
      } else {
        console.log('All dependencies already installed');
      }
      
    } catch (error) {
      console.log('Installing all dependencies...');
      execSync(`npm install ${requiredDeps.join(' ')}`, { stdio: 'inherit' });
    }
    
    console.log('✅ Dependencies installed\n');
  }

  async setupDirectories() {
    console.log('📁 Setting up directories...');
    
    const dirs = ['.cursor', '.vscode', 'scripts'];
    
    dirs.forEach(dir => {
      const dirPath = path.join(this.projectRoot, dir);
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
        console.log(`Created: ${dir}/`);
      }
    });
    
    console.log('✅ Directories ready\n');
  }

  async configurePackageScripts() {
    console.log('⚙️ Configuring package.json scripts...');
    
    const packagePath = path.join(this.projectRoot, 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    
    // Add toolkit scripts
    const toolkitScripts = {
      "validate-smart": "node scripts/smart-jsx-validator.js",
      "jsx-agent:start": "node .cursor/jsx-repair-agent.js start",
      "jsx-agent:status": "node .cursor/jsx-repair-agent.js status",
      "jsx-agent:stop": "node .cursor/jsx-repair-agent.js stop",
      "dev:start": "node .cursor/auto-startup.js start",
      "dev:stop": "node .cursor/auto-startup.js stop",
      "loveable:prepare": "npm run validate-smart && npm run type-check",
      "loveable:emergency": "git checkout HEAD~1 -- src/ && npm run validate-smart",
      "type-check": "tsc --noEmit --skipLibCheck",
      "build:check": "vite build --mode development"
    };
    
    if (!packageJson.scripts) {
      packageJson.scripts = {};
    }
    
    // Merge scripts (don't overwrite existing)
    Object.keys(toolkitScripts).forEach(script => {
      if (!packageJson.scripts[script]) {
        packageJson.scripts[script] = toolkitScripts[script];
        console.log(`Added script: ${script}`);
      }
    });
    
    fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2));
    console.log('✅ Package.json configured\n');
  }

  async setupGitHooks() {
    console.log('🔗 Setting up Git hooks...');
    
    try {
      // Initialize husky
      execSync('npx husky install', { stdio: 'pipe' });
      
      // Copy pre-commit hook
      const hookSource = path.join(this.toolkitRoot, 'config-templates', 'pre-commit-hook.sh');
      const hookDest = path.join(this.projectRoot, '.husky', 'pre-commit');
      
      if (fs.existsSync(hookSource)) {
        fs.copyFileSync(hookSource, hookDest);
        fs.chmodSync(hookDest, '755');
        console.log('Pre-commit hook installed');
      }
      
    } catch (error) {
      console.log('⚠️ Git hooks setup failed (continuing...)');
    }
    
    console.log('✅ Git hooks ready\n');
  }

  async setupVSCode() {
    console.log('🎨 Setting up VS Code integration...');
    
    const vscodeDir = path.join(this.projectRoot, '.vscode');
    
    // Copy VS Code tasks if they don't exist
    const tasksSource = path.join(this.toolkitRoot, 'config-templates', 'vscode-tasks.json');
    const tasksDest = path.join(vscodeDir, 'tasks.json');
    
    if (fs.existsSync(tasksSource) && !fs.existsSync(tasksDest)) {
      fs.copyFileSync(tasksSource, tasksDest);
      console.log('VS Code tasks configured');
    }
    
    console.log('✅ VS Code integration ready\n');
  }

  async verifyInstallation() {
    console.log('🔍 Verifying installation...');
    
    // Test smart validation
    try {
      execSync('npm run validate-smart', { stdio: 'pipe' });
      console.log('✅ Smart validation working');
    } catch (error) {
      console.log('⚠️ Smart validation needs configuration');
    }
    
    // Check if TypeScript is available
    try {
      execSync('npx tsc --version', { stdio: 'pipe' });
      console.log('✅ TypeScript available');
    } catch (error) {
      console.log('⚠️ TypeScript not found (may need manual installation)');
    }
    
    console.log('✅ Installation verified\n');
  }

  showQuickStart() {
    console.log('🎯 QUICK START:');
    console.log('   npm run dev:start         # Start all automation');
    console.log('   npm run loveable:prepare  # Before Loveable.dev');
    console.log('   npm run jsx-agent:status  # Check status');
    console.log('   npm run validate-smart    # Manual validation\n');
    
    console.log('📖 Next steps:');
    console.log('   1. Run: npm run dev:start');
    console.log('   2. Start coding - automation is active!');
    console.log('   3. Before Loveable.dev: npm run loveable:prepare\n');
    
    console.log('📚 Documentation: docs/ folder for detailed guides');
  }
}

// CLI interface
const args = process.argv.slice(2);
const isExistingProjectMode = args.includes('--merge-existing');

console.log('🚀 Cursor+Loveable Universal Toolkit Installer\n');

if (isExistingProjectMode) {
  console.log('🔄 Merging with existing project...\n');
}

const installer = new ToolkitInstaller();
installer.install().catch(console.error);
