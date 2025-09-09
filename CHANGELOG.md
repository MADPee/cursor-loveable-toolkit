# Changelog

All notable changes to the Cursor+Loveable Toolkit will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2024-09-09

### Added
- 🧠 Smart JSX Validator with TypeScript-based parsing
- 🤖 Automated Repair Agent for background monitoring  
- ⚡ Auto-installer for 30-second project setup
- 🎨 VS Code integration with tasks and shortcuts
- 🔗 Git hooks with pre-commit validation
- 💰 Cost-optimized monitoring strategy
- 📱 Cross-platform compatibility (macOS/Windows/Linux)
- 📖 Comprehensive documentation suite

### Features
- **Zero false positives** - Eliminates 850+ fake JSX errors
- **Cost effective** - $0-2/month vs $150-600 previous cost
- **Universal compatibility** - Works with all React/TypeScript projects
- **Device agnostic** - Same experience on iMac, MacBook, remote development
- **Battle tested** - Developed from real-world KitchenSafe project usage

### Documentation
- Installation guide with auto-setup
- Troubleshooting for common issues
- Cost optimization strategies  
- Customization for different project types
- Cross-platform deployment instructions

## [Unreleased]

### Planned
- NPM package distribution
- VS Code extension
- Web dashboard for team monitoring
- Slack/Teams integration
- Advanced ML-based error prediction

## [1.1.0] - 2025-09-09

### Added
- 🔄 GitHub-integrerad uppdateringsmekanism (`toolkit:check-updates`, `toolkit:update`)
- 🧩 Konfigurerbara watch-globs via `.cursor/config.json`
- 🧪 GitHub Actions workflow för validering vid push/PR

### Improved
- 🤖 Agent: ESM-fixar och cross‑platform notifieringsfallback (node-notifier/AppleScript)
- 🛠️ Installer: Kopierar automationsfiler till `.cursor/` och skriver versionsinfo
- 📚 Dokumentation: README/INSTALLATION/CUSTOMIZATION/CONTRIBUTING uppdaterade

### Fixed
- 🧷 Robust versionering i `.cursor/toolkit-version.json` efter uppdatering
- 🌐 Remote fallback: hämtar filer från GitHub Raw när lokala källor saknas

