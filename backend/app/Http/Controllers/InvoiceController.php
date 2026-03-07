<?php

namespace App\Http\Controllers;

use App\Models\Invoice;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class InvoiceController extends Controller
{
    public function index()
    {
        // Eager load relationships for the dashboard
        $invoices = Invoice::with(['customer', 'items', 'trips'])->latest()->get();
        return response()->json($invoices);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'customer_id' => 'required|exists:customers,id',
            'invoice_no' => 'required|string|unique:invoices,invoice_no',
            'invoice_date' => 'required|date',
            'po_number' => 'nullable|string',
            'state_name' => 'nullable|string',
            'state_code' => 'nullable|string',
            'due_date' => 'nullable|date',
            'purbia_gstin' => 'nullable|string',
            'purbia_pan' => 'nullable|string',
            'bank_name' => 'nullable|string',
            'branch' => 'nullable|string',
            'ifsc' => 'nullable|string',
            'account_number' => 'nullable|string',

            'items' => 'nullable|array',
            'items.*.description' => 'required|string',
            'items.*.sac_code' => 'nullable|string',
            'items.*.qty' => 'required|numeric',
            'items.*.unit' => 'nullable|string',
            'items.*.rate' => 'required|numeric',

            'trips' => 'nullable|array',
            'trips.*.inward_date' => 'nullable|date',
            'trips.*.outward_date' => 'nullable|date',
            'trips.*.company' => 'nullable|string',
            'trips.*.location' => 'nullable|string',
            'trips.*.truck_no' => 'nullable|string',
            'trips.*.distance' => 'nullable|numeric',
            'trips.*.rate' => 'nullable|numeric',
            'trips.*.detention' => 'nullable|numeric',
            'trips.*.detention_rate' => 'nullable|numeric',
        ]);

        return DB::transaction(function () use ($validated) {
            $invoiceData = collect($validated)->except(['items', 'trips'])->toArray();

            // Auto calculating totals based on items
            $subtotal = 0;
            $cgstTotal = 0;
            $sgstTotal = 0;

            $itemsData = [];
            if (isset($validated['items'])) {
                foreach ($validated['items'] as $item) {
                    $amount = $item['qty'] * $item['rate'];
                    $cgst = $amount * 0.09; // 9%
                    $sgst = $amount * 0.09; // 9%
                    $total = $amount + $cgst + $sgst;

                    $subtotal += $amount;
                    $cgstTotal += $cgst;
                    $sgstTotal += $sgst;

                    $item['amount'] = $amount;
                    $item['cgst'] = $cgst;
                    $item['sgst'] = $sgst;
                    $item['total'] = $total;
                    $itemsData[] = $item;
                }
            }

            $tripsData = [];
            if (isset($validated['trips'])) {
                foreach ($validated['trips'] as $trip) {
                    $distanceAmount = ($trip['distance'] ?? 0) * ($trip['rate'] ?? 0);
                    $detentionAmount = ($trip['detention'] ?? 0) * ($trip['detention_rate'] ?? 0);
                    $trip['total'] = $distanceAmount + $detentionAmount;

                    // We assume trips are not typically taxed here, or if they are it needs to be calculated.
                    // Following the complex WP logic, trips are just added to the line items or calculated separately.
                    $tripsData[] = $trip;
                }
            }

            $invoiceData['subtotal_amount'] = $subtotal;
            $invoiceData['cgst_amount'] = $cgstTotal;
            $invoiceData['sgst_amount'] = $sgstTotal;
            $invoiceData['grand_total'] = $subtotal + $cgstTotal + $sgstTotal;

            $invoice = Invoice::create($invoiceData);

            if (!empty($itemsData)) {
                $invoice->items()->createMany($itemsData);
            }
            if (!empty($tripsData)) {
                $invoice->trips()->createMany($tripsData);
            }

            return response()->json($invoice->load(['items', 'trips', 'customer']), 201);
        });
    }

    public function show(Invoice $invoice)
    {
        return response()->json($invoice->load(['customer', 'items', 'trips']));
    }

    public function destroy(Invoice $invoice)
    {
        $invoice->delete();
        return response()->json(['message' => 'Invoice deleted successfully']);
    }
}
