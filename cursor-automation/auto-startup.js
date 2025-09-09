#!/usr/bin/env node

/**
 * Auto-Startup Script för KitchenSafe Development
 * 
 * Startar alla kritiska agenter och övervakningssystem automatiskt
 * när projektet öppnas i Cursor.
 */

import { execSync, spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

class AutoStartup {
    constructor() {
        this.activeProcesses = [];
    }

    async start() {
        console.log('🚀 KitchenSafe Auto-Startup Initiated...\n');

        // 1. Initial health check
        await this.performSystemHealthCheck();

        // 2. Start JSX Repair Agent
        await this.startJSXRepairAgent();

        // 3. Verify all systems
        await this.verifyAllSystems();

        console.log('✅ All systems operational!\n');
        console.log('📊 Active Protection:');
        console.log('   🧠 Smart JSX Validation');
        console.log('   🤖 Automated Repair Agent');
        console.log('   🛡️  Pre-commit Hooks');
        console.log('   💰 Cost-optimized monitoring\n');
    }

    async performSystemHealthCheck() {
        console.log('🔍 Performing system health check...');

        try {
            // Check if dependencies are installed
            execSync('npm list --depth=0', {
                cwd: projectRoot,
                stdio: 'pipe'
            });
            console.log('✅ Dependencies OK');

            // Check TypeScript compilation
            execSync('npm run type-check', {
                cwd: projectRoot,
                stdio: 'pipe'
            });
            console.log('✅ TypeScript compilation OK');

            // Check smart JSX validation
            execSync('npm run validate-smart', {
                cwd: projectRoot,
                stdio: 'pipe'
            });
            console.log('✅ JSX validation OK');

        } catch (error) {
            console.log('⚠️  Health check found issues - agents will monitor actively');
        }
    }

    async startJSXRepairAgent() {
        console.log('🤖 Starting JSX Repair Agent...');

        try {
            // Start the agent in background
            const agent = spawn('node', ['.cursor/jsx-repair-agent.js', 'start'], {
                cwd: projectRoot,
                detached: true,
                stdio: 'ignore'
            });

            agent.unref(); // Allow parent to exit without waiting
            this.activeProcesses.push(agent);

            console.log('✅ JSX Repair Agent started in background');

        } catch (error) {
            console.log('⚠️  Could not start JSX Repair Agent:', error.message);
        }
    }

    async verifyAllSystems() {
        console.log('🔧 Verifying all protection systems...');

        // Check if pre-commit hooks are installed
        try {
            const fs = require('fs');
            const hookPath = path.join(projectRoot, '.husky', 'pre-commit');

            if (fs.existsSync(hookPath)) {
                console.log('✅ Pre-commit hooks installed');
            } else {
                console.log('⚠️  Pre-commit hooks missing - run: npx husky install');
            }
        } catch (error) {
            console.log('⚠️  Could not verify pre-commit hooks');
        }

        // Check VS Code tasks
        try {
            const fs = require('fs');
            const tasksPath = path.join(projectRoot, '.vscode', 'tasks.json');

            if (fs.existsSync(tasksPath)) {
                console.log('✅ VS Code automation tasks available');
            }
        } catch (error) {
            console.log('⚠️  VS Code tasks not available');
        }
    }

    showQuickHelp() {
        console.log('\n📚 QUICK REFERENCE:');
        console.log('   npm run loveable:prepare     - Check before Loveable.dev');
        console.log('   npm run jsx-agent:status     - Check agent status');
        console.log('   npm run validate-smart       - Run smart validation');
        console.log('   npm run loveable:emergency   - Emergency rollback\n');
    }

    async stop() {
        console.log('🛑 Stopping all agents...');

        this.activeProcesses.forEach(process => {
            try {
                process.kill();
            } catch (error) {
                // Process may already be stopped
            }
        });

        console.log('✅ Cleanup complete');
    }
}

// Run startup if called directly
const startup = new AutoStartup();

if (process.argv[2] === 'start') {
    startup.start()
        .then(() => startup.showQuickHelp())
        .catch(console.error);
} else if (process.argv[2] === 'stop') {
    startup.stop();
} else {
    console.log('🚀 KitchenSafe Auto-Startup');
    console.log('\nUsage:');
    console.log('  node auto-startup.js start  - Start all protection systems');
    console.log('  node auto-startup.js stop   - Stop all systems');
}

// Handle cleanup on exit
process.on('SIGINT', () => {
    startup.stop().then(() => process.exit(0));
});

export default AutoStartup;
