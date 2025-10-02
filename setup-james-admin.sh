#!/bin/bash

# Simple script to set up james@martialmarketing.org as admin
# Usage: ./setup-james-admin.sh

set -e

JAMES_EMAIL="james@martialmarketing.org"
API_URL="${NEXT_PUBLIC_APP_URL:-http://localhost:3000}"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔧 Admin Setup for $JAMES_EMAIL"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Step 1: Check current status
echo "📍 Step 1: Checking current admin status..."
echo ""

STATUS=$(curl -s "$API_URL/api/admin/setup-james")
EXISTS=$(echo "$STATUS" | jq -r '.exists')
IS_ADMIN=$(echo "$STATUS" | jq -r '.isAdmin')

echo "$STATUS" | jq .
echo ""

# Step 2: Decide action based on status
if [ "$EXISTS" = "false" ]; then
    echo "⚠️  User not registered yet!"
    echo ""
    echo "Please complete these steps:"
    echo "  1. Go to $API_URL/auth/sign-up"
    echo "  2. Register with email: $JAMES_EMAIL"
    echo "  3. Complete email verification (if required)"
    echo "  4. Run this script again"
    echo ""
    exit 0
fi

if [ "$IS_ADMIN" = "true" ]; then
    echo "✅ $JAMES_EMAIL is already an admin!"
    echo ""
    echo "Current role: $(echo "$STATUS" | jq -r '.role')"
    echo ""
    echo "You can access the admin panel at:"
    echo "  $API_URL/admin"
    echo ""
    exit 0
fi

# Step 3: Grant admin access
echo "🚀 Step 2: Granting admin privileges..."
echo ""

SETUP_RESPONSE=$(curl -s -X POST "$API_URL/api/admin/setup-james")
SUCCESS=$(echo "$SETUP_RESPONSE" | jq -r '.success')

if [ "$SUCCESS" = "true" ]; then
    echo "✅ SUCCESS! Admin privileges granted!"
    echo ""
    echo "$SETUP_RESPONSE" | jq .
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "🎉 Admin Setup Complete!"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "Admin Features Enabled:"
    echo "  ✓ Unlimited blueprints"
    echo "  ✓ Unlimited exports"
    echo "  ✓ All premium features"
    echo "  ✓ Admin panel access"
    echo "  ✓ User management"
    echo "  ✓ System settings"
    echo "  ✓ No payment required"
    echo ""
    echo "Access the admin panel at:"
    echo "  👉 $API_URL/admin"
    echo ""
else
    echo "❌ Failed to grant admin access!"
    echo ""
    echo "$SETUP_RESPONSE" | jq .
    echo ""
    echo "Troubleshooting:"
    echo "  1. Check that SUPABASE_SERVICE_ROLE_KEY is set in .env.local"
    echo "  2. Verify user registered successfully"
    echo "  3. Check database migrations are applied"
    echo "  4. See ADMIN_SETUP_GUIDE.md for detailed instructions"
    echo ""
    exit 1
fi
