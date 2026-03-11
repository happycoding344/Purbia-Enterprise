<?php

namespace App\Http\Controllers;

use App\Models\Lr;
use App\Models\Invoice;
use App\Models\Vehicle;
use Illuminate\Http\Request;

class GlobalSearchController extends Controller
{
    /**
     * Global search across LRs, Invoices, and Vehicles
     */
    public function search(Request $request)
    {
        $query = $request->query('q', '');

        if (strlen($query) < 2) {
            return response()->json([
                'lrs' => [],
                'invoices' => [],
                'vehicles' => [],
            ]);
        }

        // Search LRs
        $lrs = Lr::where('lr_no', 'LIKE', "%{$query}%")
            ->orWhere('manifest_no', 'LIKE', "%{$query}%")
            ->orWhere('financial_year', 'LIKE', "%{$query}%")
            ->with(['vehicle:id,registration_no', 'consignor:id,name', 'consignee:id,name'])
            ->limit(10)
            ->get()
            ->map(function ($lr) {
                return [
                    'id' => $lr->id,
                    'type' => 'LR',
                    'title' => "LR: {$lr->lr_no}",
                    'subtitle' => "Manifest: {$lr->manifest_no} | {$lr->financial_year}",
                    'details' => "Vehicle: " . ($lr->vehicle->registration_no ?? 'N/A'),
                    'url' => '#/lr-preparation',
                ];
            });

        // Search Invoices
        $invoices = Invoice::where('invoice_no', 'LIKE', "%{$query}%")
            ->orWhere('business_type', 'LIKE', "%{$query}%")
            ->with(['billingParty:id,name', 'state:id,name'])
            ->limit(10)
            ->get()
            ->map(function ($invoice) {
                return [
                    'id' => $invoice->id,
                    'type' => 'Invoice',
                    'title' => "Invoice: {$invoice->invoice_no}",
                    'subtitle' => "{$invoice->business_type} | " . ($invoice->billingParty->name ?? 'N/A'),
                    'details' => "Total: ₹" . number_format($invoice->total_amount, 2),
                    'url' => '#/invoice-history',
                ];
            });

        // Search Vehicles
        $vehicles = Vehicle::where('registration_no', 'LIKE', "%{$query}%")
            ->orWhere('owner_name', 'LIKE', "%{$query}%")
            ->orWhere('party_name', 'LIKE', "%{$query}%")
            ->limit(10)
            ->get()
            ->map(function ($vehicle) {
                return [
                    'id' => $vehicle->id,
                    'type' => 'Vehicle',
                    'title' => "Vehicle: {$vehicle->registration_no}",
                    'subtitle' => "Owner: " . ($vehicle->owner_name ?? 'N/A'),
                    'details' => "Party: " . ($vehicle->party_name ?? 'N/A'),
                    'url' => '#/vehicle-master',
                ];
            });

        return response()->json([
            'lrs' => $lrs,
            'invoices' => $invoices,
            'vehicles' => $vehicles,
            'total' => $lrs->count() + $invoices->count() + $vehicles->count(),
        ]);
    }
}
