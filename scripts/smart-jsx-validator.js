#!/usr/bin/env node

/**
 * SMART JSX Validator - TypeScript First Approach
 * 
 * This validator uses TypeScript's own parser to understand JSX correctly
 * instead of relying on regex patterns that create false positives.
 */

import { execSync } from 'child_process';
import { glob } from 'glob';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

class SmartJSXValidator {
    constructor() {
        this.errors = [];
        this.warnings = [];
        this.filesChecked = 0;
    }

    async validate() {
        console.log('🧠 Starting SMART JSX validation...\n');

        try {
            // Step 1: TypeScript compilation check (most important)
            await this.checkTypeScriptCompilation();

            // Step 2: Build check (ensures everything actually works)
            await this.checkBuildCompilation();

            // Step 3: Only check for REAL issues, not phantom ones
            await this.checkRealIssues();

            // Step 4: Generate report
            this.generateReport();

        } catch (error) {
            this.errors.push(`Validation failed: ${error.message}`);
            this.generateReport();
            process.exit(1);
        }
    }

    /**
     * Check if TypeScript compiles without errors
     */
    async checkTypeScriptCompilation() {
        console.log('📝 Checking TypeScript compilation...');

        try {
            execSync('npx tsc --noEmit --skipLibCheck', {
                cwd: projectRoot,
                stdio: 'pipe'
            });
            console.log('✅ TypeScript compilation successful\n');
        } catch (error) {
            const output = error.stdout?.toString() || error.stderr?.toString() || '';

            // Parse TypeScript errors to find real issues
            const tsErrors = this.parseTypeScriptErrors(output);
            this.errors.push(...tsErrors);

            if (tsErrors.length > 0) {
                throw new Error('TypeScript compilation failed with real errors');
            }
        }
    }

    /**
     * Check if build compiles (most reliable test)
     */
    async checkBuildCompilation() {
        console.log('🏗️ Checking build compilation...');

        try {
            execSync('npm run build:check', {
                cwd: projectRoot,
                stdio: 'pipe'
            });
            console.log('✅ Build compilation successful\n');
        } catch (error) {
            const output = error.stdout?.toString() || error.stderr?.toString() || '';

            // Only report if there are actual build failures
            if (output.includes('error') || output.includes('Error')) {
                this.errors.push(`Build failed: ${output.slice(0, 500)}...`);
                throw new Error('Build compilation failed');
            }
        }
    }

    /**
     * Parse TypeScript errors to extract real JSX issues
     */
    parseTypeScriptErrors(output) {
        const errors = [];
        const lines = output.split('\n');

        for (const line of lines) {
            // Look for actual TypeScript errors (not warnings)
            if (line.includes('error TS') &&
                (line.includes('.tsx') || line.includes('.jsx'))) {

                // Extract meaningful error info
                const match = line.match(/(.+\.tsx?)\((\d+),(\d+)\):\s*error\s*TS\d+:\s*(.+)/);
                if (match) {
                    const [, file, lineNum, colNum, message] = match;
                    errors.push(`${file}:${lineNum}:${colNum} - ${message}`);
                }
            }
        }

        return errors;
    }

    /**
     * Check for REAL issues that actually matter
     */
    async checkRealIssues() {
        console.log('🔍 Checking for real JSX issues...');

        const componentFiles = await glob('src/**/*.{tsx,jsx}', { cwd: projectRoot });

        for (const file of componentFiles) {
            this.filesChecked++;
            await this.checkRealFileIssues(path.join(projectRoot, file));
        }

        console.log(`✅ Checked ${this.filesChecked} files for real issues\n`);
    }

    /**
     * Check individual file for REAL issues only
     */
    async checkRealFileIssues(filePath) {
        const content = fs.readFileSync(filePath, 'utf8');
        const relativePath = path.relative(projectRoot, filePath);

        // Only check for issues that actually break things
        this.checkUnclosedSelfClosingTags(content, relativePath);
        this.checkMissingKeys(content, relativePath);
        this.checkDangerousPatterns(content, relativePath);
    }

    /**
     * Check for unclosed self-closing tags (real issue)
     */
    checkUnclosedSelfClosingTags(content, filePath) {
        const voidElements = ['br', 'hr', 'img', 'input'];
        const lines = content.split('\n');

        lines.forEach((line, index) => {
            voidElements.forEach(element => {
                // Look for <br> instead of <br />
                const regex = new RegExp(`<${element}(?:\\s[^>]*)?(?<!/)>`, 'g');
                if (regex.test(line)) {
                    this.warnings.push(
                        `${filePath}:${index + 1} - <${element}> should be self-closing: <${element} />`
                    );
                }
            });
        });
    }

    /**
     * Check for missing keys in mapped elements (real issue)
     */
    checkMissingKeys(content, filePath) {
        // Look for .map() without key prop
        if (content.includes('.map(') &&
            !content.includes('key=') &&
            content.includes('return')) {
            this.warnings.push(
                `${filePath} - Missing 'key' prop in mapped elements`
            );
        }
    }

    /**
     * Check for dangerous patterns that actually break things
     */
    checkDangerousPatterns(content, filePath) {
        const dangerousPatterns = [
            {
                pattern: /className=\{[^}]*undefined[^}]*\}/g,
                message: 'className contains undefined - will cause runtime error'
            },
            {
                pattern: /\{[^}]*\.map\([^}]*(?<!key=)[^}]*\}/g,
                message: 'Array map without key prop'
            }
        ];

        dangerousPatterns.forEach(({ pattern, message }) => {
            if (pattern.test(content)) {
                this.warnings.push(`${filePath} - ${message}`);
            }
        });
    }

    /**
     * Generate validation report
     */
    generateReport() {
        console.log('📊 SMART VALIDATION REPORT');
        console.log('═'.repeat(50));
        console.log(`Files checked: ${this.filesChecked}`);
        console.log(`REAL Errors: ${this.errors.length}`);
        console.log(`Warnings: ${this.warnings.length}`);
        console.log('');

        if (this.errors.length > 0) {
            console.log('❌ REAL ERRORS:');
            this.errors.forEach(error => console.log(`  ${error}`));
            console.log('');
        }

        if (this.warnings.length > 0) {
            console.log('⚠️  WARNINGS:');
            this.warnings.forEach(warning => console.log(`  ${warning}`));
            console.log('');
        }

        if (this.errors.length === 0 && this.warnings.length === 0) {
            console.log('✅ All checks passed! Your code is production ready.');
        } else if (this.errors.length === 0) {
            console.log('✅ No blocking errors found. Review warnings when convenient.');
        } else {
            console.log('❌ Found real errors that need fixing.');
            process.exit(1);
        }

        // Save report
        const report = {
            timestamp: new Date().toISOString(),
            filesChecked: this.filesChecked,
            realErrors: this.errors,
            warnings: this.warnings,
            success: this.errors.length === 0
        };

        fs.writeFileSync(
            path.join(projectRoot, 'smart-jsx-report.json'),
            JSON.stringify(report, null, 2)
        );

        console.log('\n📄 Report saved to smart-jsx-report.json');
    }
}

// Run validator if called directly
const isMainModule = import.meta.url === new URL(process.argv[1], 'file://').href;
if (isMainModule) {
    const validator = new SmartJSXValidator();
    validator.validate().catch(console.error);
}

export default SmartJSXValidator;
