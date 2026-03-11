#!/bin/bash
# One-time script to update admin credentials on production
# This will be executed via SSH and then deleted

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🔐 Updating Admin Credentials...${NC}"

# SSH into server and run PHP script
sshpass -p "$HOSTINGER_SSH_PASS" \
  ssh -p 65002 -o StrictHostKeyChecking=no \
  u678926284@82.25.125.224 \
  "cd /home/u678926284/domains/purbiaenterprise.com/public_html/auth && \
   /usr/bin/php backend/update-admin-user.php && \
   echo -e '${GREEN}✓ Credentials updated successfully!${NC}' && \
   rm backend/update-admin-user.php && \
   echo -e '${GREEN}✓ Update script deleted for security${NC}'"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ All done! Admin credentials have been updated.${NC}"
    echo -e "${YELLOW}⚠️  Please test login at: https://auth.purbiaenterprise.com/${NC}"
else
    echo -e "${RED}❌ Update failed. Please check the error above.${NC}"
    exit 1
fi
