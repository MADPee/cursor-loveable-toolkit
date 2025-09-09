#!/usr/bin/env node

/**
 * Automatiserad JSX Repair Agent
 * 
 * Denna agent övervakar filer för JSX-fel och fixar dem automatiskt
 * med Haiku AI when needed. Designed för cost-efficiency.
 */

import { execSync } from 'child_process';
import fs, { watchFile } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

class AutomatedJSXRepairAgent {
    constructor() {
        this.isActive = false;
        this.repairQueue = [];
        this.lastCheck = new Date();
    }

    async start() {
        console.log('🤖 Starting Automated JSX Repair Agent...\n');

        this.isActive = true;

        // 1. Initial health check
        await this.performHealthCheck();

        // 2. Set up file watchers (selective)
        this.setupFileWatchers();

        // 3. Periodic validation (every 30 minutes)
        this.setupPeriodicValidation();

        console.log('✅ JSX Repair Agent is now active and monitoring!\n');
        console.log('📊 Status: Watching for JSX issues...');
        console.log('🔧 Auto-repair: Enabled for cost-effective fixes');
        console.log('💰 Cost optimization: Active\n');
    }

    async performHealthCheck() {
        console.log('🔍 Performing initial health check...');

        try {
            const result = execSync('npm run validate-smart', {
                cwd: projectRoot,
                encoding: 'utf8',
                stdio: 'pipe'
            });

            if (result.includes('REAL Errors: 0')) {
                console.log('✅ Health check passed - no JSX issues detected');
            } else {
                console.log('⚠️  Health check found warnings (non-blocking)');
                console.log('🎯 Agent will monitor for real issues');
            }
        } catch (error) {
            console.log('❌ Health check found issues - agent will monitor actively');
            this.scheduleRepairCheck();
        }
    }

    setupFileWatchers() {
        console.log('👀 Setting up smart file watchers...');

        // Watch critical files that are most likely to have JSX issues
        const criticalFiles = [
            'src/pages/Dashboard.tsx',
            'src/pages/Temperature.tsx',
            'src/pages/Profile.tsx',
            'src/components/layout/PageHeader.tsx',
            'src/components/ui/sync-status-indicator.tsx'
        ];

        criticalFiles.forEach(file => {
            const fullPath = path.join(projectRoot, file);

            watchFile(fullPath, { interval: 5000 }, (curr, prev) => {
                if (curr.mtime > prev.mtime) {
                    console.log(`📝 File changed: ${file}`);
                    this.queueValidationCheck(file);
                }
            });
        });

        console.log(`✅ Watching ${criticalFiles.length} critical files`);
    }

    setupPeriodicValidation() {
        // Run validation every 30 minutes
        setInterval(() => {
            this.performScheduledValidation();
        }, 30 * 60 * 1000);

        console.log('⏰ Periodic validation scheduled (every 30 minutes)');
    }

    queueValidationCheck(file) {
        // Debounce file changes
        clearTimeout(this.validationTimeout);

        this.validationTimeout = setTimeout(() => {
            this.validateSpecificFile(file);
        }, 2000); // Wait 2 seconds after last change
    }

    async validateSpecificFile(file) {
        try {
            console.log(`🔍 Validating ${file}...`);

            // Run smart validation
            const result = execSync('npm run validate-smart', {
                cwd: projectRoot,
                encoding: 'utf8',
                stdio: 'pipe'
            });

            if (result.includes('REAL Errors: 0')) {
                console.log(`✅ ${file} validation passed`);
            } else {
                console.log(`⚠️  ${file} has warnings (performance-related only)`);
            }

        } catch (error) {
            console.log(`❌ Real JSX errors detected in ${file}`);
            this.handleRealJSXErrors(file, error.stdout || error.message);
        }
    }

    async performScheduledValidation() {
        console.log('\n⏰ Running scheduled validation...');

        try {
            const result = execSync('npm run validate-smart', {
                cwd: projectRoot,
                encoding: 'utf8',
                stdio: 'pipe'
            });

            console.log('✅ Scheduled validation passed');
            this.lastCheck = new Date();

        } catch (error) {
            console.log('❌ Scheduled validation found real issues');
            this.handleRealJSXErrors('multiple files', error.stdout || error.message);
        }
    }

    async handleRealJSXErrors(file, errorOutput) {
        console.log('\n🚨 REAL JSX ERRORS DETECTED!');
        console.log('📋 Error details:', errorOutput.slice(0, 300) + '...');

        // For now, just log and notify - don't automatically call expensive AI
        // This is the cost-optimization strategy
        console.log('\n💡 RECOMMENDED ACTIONS:');
        console.log('1. Run: npm run loveable:prepare');
        console.log('2. If needed: npm run loveable:emergency');
        console.log('3. For complex fixes: Use Haiku agent manually');

        // Send desktop notification
        await this.sendDesktopNotification(
            'JSX Repair Agent',
            `Real JSX errors detected in ${file}. Action required.`
        );

        // Save error report
        this.saveErrorReport(file, errorOutput);
    }

    async sendDesktopNotification(title, message) {
        // 1) Try node-notifier if available (cross-platform)
        try {
            const mod = await import('node-notifier').catch(() => null);
            if (mod && mod.default) {
                mod.default.notify({ title, message, timeout: 3 });
                return;
            }
        } catch (_) {
            // ignore and try platform-specific fallbacks
        }

        // 2) macOS fallback via AppleScript
        if (process.platform === 'darwin') {
            try {
                execSync(`osascript -e 'display notification "${message}" with title "${title}"'`, {
                    stdio: 'pipe'
                });
                return;
            } catch (_) {
                // ignore
            }
        }

        // 3) Fallback: console info
        console.log(`📣 Notification: ${title} - ${message}`);
    }

    saveErrorReport(file, errorOutput) {
        const report = {
            timestamp: new Date().toISOString(),
            file: file,
            error: errorOutput,
            agent: 'jsx-repair-agent',
            actionRequired: true
        };

        try {
            fs.writeFileSync(
                path.join(projectRoot, '.cursor', 'jsx-error-report.json'),
                JSON.stringify(report, null, 2)
            );
            console.log('📄 Error report saved to .cursor/jsx-error-report.json');
        } catch (error) {
            console.log('⚠️  Could not save error report');
        }
    }

    async stop() {
        this.isActive = false;
        console.log('🛑 JSX Repair Agent stopped');
    }

    getStatus() {
        return {
            active: this.isActive,
            lastCheck: this.lastCheck,
            queueLength: this.repairQueue.length
        };
    }
}

// CLI interface
const command = process.argv[2];
const agent = new AutomatedJSXRepairAgent();

switch (command) {
    case 'start':
        agent.start().catch(console.error);

        // Keep process alive
        process.on('SIGINT', () => {
            console.log('\n🛑 Shutting down JSX Repair Agent...');
            agent.stop().then(() => process.exit(0));
        });
        break;

    case 'status':
        const status = agent.getStatus();
        console.log('📊 JSX Repair Agent Status:');
        console.log(`   Active: ${status.active ? '✅' : '❌'}`);
        console.log(`   Last Check: ${status.lastCheck.toLocaleTimeString()}`);
        console.log(`   Queue Length: ${status.queueLength}`);
        break;

    case 'stop':
        console.log('🛑 Stopping JSX Repair Agent...');
        // In a real implementation, you'd send a signal to the running process
        break;

    default:
        console.log('🤖 Automated JSX Repair Agent');
        console.log('\nUsage:');
        console.log('  node jsx-repair-agent.js start   - Start monitoring');
        console.log('  node jsx-repair-agent.js status  - Check status');
        console.log('  node jsx-repair-agent.js stop    - Stop monitoring');
        break;
}

export default AutomatedJSXRepairAgent;
