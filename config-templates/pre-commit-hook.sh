#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

# KitchenSafe Pre-commit Hook
# Ensures Loveable.dev compatibility before commits

echo "🔍 Running pre-commit checks for Loveable.dev compatibility..."

# 1. Run TypeScript check
echo "📝 Checking TypeScript..."
npm run type-check || {
  echo "❌ TypeScript errors found. Please fix before committing."
  exit 1
}

# 2. Run SMART JSX validation (no false positives)
echo "🧠 Running smart JSX validation..."
npm run validate-smart || {
  echo "❌ Smart JSX validation failed. Real structural issues found."
  exit 1
}

# 3. Run ESLint on staged files
echo "🔍 Running ESLint on staged files..."
npx lint-staged || {
  echo "❌ ESLint errors found. Please fix before committing."
  exit 1
}

# 4. Test build (quick validation)
echo "🏗️  Testing build..."
npm run build:check || {
  echo "❌ Build failed. Please fix before committing."
  exit 1
}

echo "✅ All pre-commit checks passed! Committing changes..."