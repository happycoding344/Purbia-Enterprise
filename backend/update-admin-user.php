<?php
/**
 * Secure script to update admin user credentials
 * This script should be run once via SSH on the production server
 * and then deleted immediately after use.
 */

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\User;
use Illuminate\Support\Facades\Hash;

// ===================================================================
// UPDATE THESE CREDENTIALS AS NEEDED
// ===================================================================
$newEmail = 'admin@purbiaenterprise.com';
$newPassword = 'PurbiaSecure2026!';  // Strong password
$newName = 'Purbia Admin';
// ===================================================================

try {
    // Find the old admin user
    $oldUser = User::where('email', 'admin@purbia.com')->orWhere('email', 'test@example.com')->first();

    if ($oldUser) {
        // Update existing user
        $oldUser->update([
            'name' => $newName,
            'email' => $newEmail,
            'password' => Hash::make($newPassword),
        ]);

        echo "✓ Admin user updated successfully!\n";
        echo "  Email: {$newEmail}\n";
        echo "  Name: {$newName}\n";
        echo "  Password: [HIDDEN]\n";
    } else {
        // Create new admin user if none exists
        User::create([
            'name' => $newName,
            'email' => $newEmail,
            'password' => Hash::make($newPassword),
            'email_verified_at' => now(),
        ]);

        echo "✓ New admin user created successfully!\n";
        echo "  Email: {$newEmail}\n";
        echo "  Name: {$newName}\n";
        echo "  Password: [HIDDEN]\n";
    }

    echo "\n⚠️  IMPORTANT: Delete this script immediately after use!\n";
    echo "   Run: rm " . __FILE__ . "\n\n";

} catch (Exception $e) {
    echo "✗ Error: " . $e->getMessage() . "\n";
    exit(1);
}
