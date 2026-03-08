#!/bin/bash
# Deployment post-process: fix file permissions and asset paths
# Run this after every SCP upload to fix permissions on the Hostinger server

DEPLOY_DIR="/home/u678926284/domains/purbiaenterprise.com/public_html/auth/public"

echo "=== Purbia Enterprise Deployment Post-Process ==="

# Fix directory permissions to allow web server read access
echo "1. Fixing file permissions..."
find "$DEPLOY_DIR" -type d -exec chmod 755 {} \;
find "$DEPLOY_DIR" -type f -exec chmod 644 {} \;

# Fix index.html asset paths (root-absolute to relative)
echo "2. Fixing asset paths in index.html..."
sed -i 's|href="/assets/|href="./assets/|g' "$DEPLOY_DIR/index.html"
sed -i 's|src="/assets/|src="./assets/|g' "$DEPLOY_DIR/index.html"

echo "3. Done! Current index.html:"
cat "$DEPLOY_DIR/index.html"

echo ""
echo "=== Deployment post-process complete ==="
