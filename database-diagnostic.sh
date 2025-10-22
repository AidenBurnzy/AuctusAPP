#!/bin/bash
# Database Connection Diagnostic Script
# Usage: bash database-diagnostic.sh

echo "================================"
echo "AuctusAPP Database Diagnostic"
echo "================================"
echo ""

# Check if Netlify CLI is available
if ! command -v netlify &> /dev/null; then
    echo "⚠️  Netlify CLI not found. Install it with: npm install -g netlify-cli"
    echo ""
fi

# Get the site ID
SITE_ID=$(cat .netlify/state.json 2>/dev/null | grep -o '"siteId":"[^"]*' | cut -d'"' -f4)

if [ -z "$SITE_ID" ]; then
    echo "❌ Could not find Netlify site ID"
    echo "   Make sure you've run 'netlify link' first"
    echo ""
    exit 1
fi

echo "✅ Found Netlify Site ID: $SITE_ID"
echo ""

# Check environment variables
echo "Checking Environment Variables..."
echo ""

ENV_VARS=$(netlify env:list 2>/dev/null || echo "failed")

if [[ "$ENV_VARS" == "failed" ]]; then
    echo "❌ Could not fetch environment variables"
    echo "   Make sure you're logged into Netlify: netlify login"
    echo ""
else
    echo "$ENV_VARS"
    echo ""
    
    # Check for required variables
    if echo "$ENV_VARS" | grep -q "NEON_DATABASE_URL"; then
        echo "✅ NEON_DATABASE_URL is set"
    else
        echo "❌ NEON_DATABASE_URL is NOT set"
        echo "   Add it with: netlify env:set NEON_DATABASE_URL 'your-connection-string'"
    fi
    
    if echo "$ENV_VARS" | grep -q "JWT_SECRET"; then
        echo "✅ JWT_SECRET is set"
    else
        echo "❌ JWT_SECRET is NOT set"
        echo "   Generate one with: openssl rand -base64 32"
        echo "   Then set it with: netlify env:set JWT_SECRET 'your-secret'"
    fi
    
    if echo "$ENV_VARS" | grep -q "DB_INIT_ENABLED"; then
        DB_INIT=$(echo "$ENV_VARS" | grep "DB_INIT_ENABLED" | cut -d'=' -f2)
        echo "✅ DB_INIT_ENABLED is set to: $DB_INIT"
        if [ "$DB_INIT" != "false" ]; then
            echo "   ⚠️  Production tip: Set to 'false' after initial setup"
        fi
    else
        echo "⚠️  DB_INIT_ENABLED is not set (defaults to false - which is correct for production)"
    fi
    
    echo ""
fi

# Test database connection
echo "Testing Database Functions..."
echo ""

# Get deployed site URL
SITE_URL=$(netlify sites:list 2>/dev/null | grep "URL" | head -1 | awk '{print $NF}')

if [ -z "$SITE_URL" ]; then
    echo "❌ Could not determine site URL"
    echo "   Deploy your site first or run: netlify deploy"
    echo ""
else
    echo "Testing endpoint: $SITE_URL/.netlify/functions/clients"
    echo ""
    
    # Try without auth (should fail with 401)
    RESPONSE=$(curl -s -w "\n%{http_code}" "$SITE_URL/.netlify/functions/clients" 2>/dev/null)
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    BODY=$(echo "$RESPONSE" | sed '$d')
    
    if [ "$HTTP_CODE" == "401" ]; then
        echo "✅ Authentication working correctly (got 401 Unauthorized)"
        echo "   This is expected - valid JWT token required"
    elif [ "$HTTP_CODE" == "500" ]; then
        echo "❌ Server error (500)"
        echo "   Error: $BODY"
        echo "   Possible cause: NEON_DATABASE_URL not set or invalid"
    elif [ "$HTTP_CODE" == "200" ]; then
        echo "⚠️  Got 200 OK without token (should require auth)"
        echo "   Check authentication implementation"
    else
        echo "⚠️  Got HTTP $HTTP_CODE"
        echo "   Response: $BODY"
    fi
    echo ""
fi

# Check local functions (if running locally)
echo "Checking Local Functions..."
echo ""

if [ -d "netlify/functions" ]; then
    echo "✅ Found netlify/functions directory"
    
    # Count functions
    FUNC_COUNT=$(ls -1 netlify/functions/*.js 2>/dev/null | wc -l)
    echo "   Functions found: $FUNC_COUNT"
    
    # Check for required files
    REQUIRED_FILES=("db-init.js" "clients.js" "auth-helper.js" "users.js")
    for file in "${REQUIRED_FILES[@]}"; do
        if [ -f "netlify/functions/$file" ]; then
            echo "   ✅ $file"
        else
            echo "   ❌ $file (MISSING)"
        fi
    done
else
    echo "❌ netlify/functions directory not found"
fi

echo ""
echo "================================"
echo "Diagnostic Complete"
echo "================================"
echo ""
echo "Next Steps:"
echo "1. Ensure all environment variables are set"
echo "2. Deploy functions with: netlify deploy --functions"
echo "3. Test with: curl -H 'Authorization: Bearer <token>' <url>/.netlify/functions/clients"
echo ""
