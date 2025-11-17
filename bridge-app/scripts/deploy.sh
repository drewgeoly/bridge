#!/bin/bash

# Deployment script for Bridge app
# This script helps you deploy to Vercel and apply Supabase migrations

set -e  # Exit on error

echo "🚀 Bridge Deployment Script"
echo "============================"
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}Error: Must run from bridge-app directory${NC}"
    exit 1
fi

# Step 1: Check Supabase CLI
echo -e "${YELLOW}Step 1: Checking Supabase CLI...${NC}"
if ! command -v supabase &> /dev/null; then
    echo -e "${RED}Supabase CLI not found. Install it with:${NC}"
    echo "  brew install supabase/tap/supabase"
    echo "  Or visit: https://github.com/supabase/cli/releases"
    exit 1
fi
echo -e "${GREEN}✓ Supabase CLI found${NC}"
echo ""

# Step 2: Check if project is linked
echo -e "${YELLOW}Step 2: Checking Supabase project link...${NC}"
if [ ! -f ".supabase/config.toml" ]; then
    echo -e "${YELLOW}⚠ Project not linked. Run:${NC}"
    echo "  supabase link --project-ref YOUR_PROJECT_REF"
    echo ""
    read -p "Do you want to link now? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        read -p "Enter your Supabase project ref: " PROJECT_REF
        supabase link --project-ref "$PROJECT_REF"
    else
        echo -e "${YELLOW}Skipping Supabase link. Make sure to link before applying migrations.${NC}"
    fi
else
    echo -e "${GREEN}✓ Supabase project is linked${NC}"
fi
echo ""

# Step 3: Apply migrations
echo -e "${YELLOW}Step 3: Applying Supabase migrations...${NC}"
read -p "Do you want to apply migrations to Supabase? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    supabase db push
    echo -e "${GREEN}✓ Migrations applied${NC}"
else
    echo -e "${YELLOW}⚠ Skipping migrations${NC}"
fi
echo ""

# Step 4: Run tests
echo -e "${YELLOW}Step 4: Running tests...${NC}"
read -p "Do you want to run tests? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    npm test -- --run
    echo -e "${GREEN}✓ Tests passed${NC}"
else
    echo -e "${YELLOW}⚠ Skipping tests${NC}"
fi
echo ""

# Step 5: Build check
echo -e "${YELLOW}Step 5: Checking build...${NC}"
read -p "Do you want to test the build? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    npm run build
    echo -e "${GREEN}✓ Build successful${NC}"
else
    echo -e "${YELLOW}⚠ Skipping build check${NC}"
fi
echo ""

# Step 6: Git status
echo -e "${YELLOW}Step 6: Checking git status...${NC}"
if [ -d ".git" ]; then
    git status
    echo ""
    read -p "Do you want to commit and push changes? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        read -p "Enter commit message: " COMMIT_MSG
        git add .
        git commit -m "$COMMIT_MSG"
        git push origin main
        echo -e "${GREEN}✓ Changes pushed to GitHub${NC}"
        echo -e "${GREEN}Vercel will automatically deploy!${NC}"
    else
        echo -e "${YELLOW}⚠ Skipping git push${NC}"
    fi
else
    echo -e "${YELLOW}⚠ Not a git repository${NC}"
fi
echo ""

echo -e "${GREEN}✅ Deployment checklist complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Check Vercel dashboard for deployment status"
echo "2. Verify environment variables are set in Vercel"
echo "3. Test your deployed app"
echo ""
echo "For manual deployment, run: vercel --prod"

