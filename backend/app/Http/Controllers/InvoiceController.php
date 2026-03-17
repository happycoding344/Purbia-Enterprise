<?php

namespace App\Http\Controllers;

use App\Models\Invoice;
use App\Models\ActivityLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class InvoiceController extends Controller
{
    public function index()
    {
        return response()->json(Invoice::with(['customer', 'items', 'lrs', 'attachments', 'billingParty', 'state'])->latest()->get());
    }

    public function store(Request $request)
    {
        $request->validate([
            'business_type' => 'required|string|in:BEIL,PI',
            'invoice_no' => 'required|string|max:255|unique:invoices,invoice_no',
            'invoice_date' => 'required|date',
            'billing_party_id' => 'required|exists:billing_parties,id',
            'customer_id' => 'nullable|exists:customers,id',
            'delivery_address' => 'nullable|string',
            'state_id' => 'required|exists:states,id',
            'state_code' => 'nullable|string',
            'gst_number' => 'nullable|string',
            'po_number' => 'nullable|string',
            'payment_due_date' => 'nullable|date',
            'subject' => 'nullable|string',
            'hsn_code' => 'nullable|string',

            // BEIL specific items
            'items' => 'required_if:business_type,BEIL|array',
            'items.*.description' => 'required|string',
            'items.*.sac_code' => 'nullable|string',
            'items.*.qty' => 'required|numeric',
            'items.*.unit' => 'required|string',
            'items.*.rate' => 'required|numeric',
            'items.*.cgst' => 'nullable|numeric',
            'items.*.sgst' => 'nullable|numeric',

            // PI specific LRs
            'lr_ids' => 'required_if:business_type,PI|array',
            'lr_ids.*' => 'exists:lrs,id',

            // PI specific line items
            'pi_items' => 'nullable|array',
            'pi_items.*.lr_id' => 'required|exists:lrs,id',
            'pi_items.*.lr_no' => 'required|string',
            'pi_items.*.distance_range' => 'nullable|string',
            'pi_items.*.qty_display' => 'required|string',
            'pi_items.*.actual_qty' => 'required|numeric',
            'pi_items.*.rate' => 'required|numeric',
            'pi_items.*.amount' => 'required|numeric',
            'pi_items.*.detention_days' => 'nullable|numeric',
            'pi_items.*.detention_rate' => 'nullable|numeric',
            'pi_items.*.detention_amount' => 'nullable|numeric',

            // Calculations
            'amount' => 'required|numeric',
            'gst_amount' => 'required|numeric',
            'sgst_amount' => 'required|numeric',
            'cgst_amount' => 'required|numeric',
            'total_amount' => 'required|numeric',
            'total_amount_words' => 'nullable|string',

            'attachments.*' => 'nullable|file|max:51200',
        ]);

        return DB::transaction(function () use ($request) {
            $invoice = Invoice::create($request->except(['items', 'lr_ids', 'pi_items', 'attachments']));

            // Handle BEIL Items
            if ($request->business_type === 'BEIL') {
                foreach ($request->items as $item) {
                    $item['amount'] = $item['qty'] * $item['rate'];
                    $item['total'] = $item['amount'] + ($item['cgst'] ?? 0) + ($item['sgst'] ?? 0);
                    $invoice->items()->create($item);
                }
            }

            // Handle PI LRs and Items
            if ($request->business_type === 'PI') {
                $invoice->lrs()->sync($request->lr_ids);

                // Store PI line items with detailed information
                if ($request->has('pi_items') && is_array($request->pi_items)) {
                    foreach ($request->pi_items as $piItem) {
                        $invoice->items()->create([
                            'lr_id' => $piItem['lr_id'],
                            'lr_no' => $piItem['lr_no'],
                            'distance_range' => $piItem['distance_range'],
                            'description' => "Transportation for LR {$piItem['lr_no']} ({$piItem['distance_range']} Kms)",
                            'sac_code' => '996511',
                            'qty' => $piItem['actual_qty'], // Use numeric actual_qty, not the display string
                            'qty_display' => $piItem['qty_display'],
                            'actual_qty' => $piItem['actual_qty'], // Actual quantity for calculation
                            'unit' => 'Per trip',
                            'rate' => $piItem['rate'],
                            'amount' => $piItem['amount'], // Calculated from actual_qty * rate
                            'cgst' => $piItem['amount'] * 0.09,
                            'sgst' => $piItem['amount'] * 0.09,
                            'total' => $piItem['amount'] * 1.18,
                            'detention_days' => $piItem['detention_days'] ?? 0,
                            'detention_rate' => $piItem['detention_rate'] ?? 0,
                            'detention_amount' => $piItem['detention_amount'] ?? 0,
                        ]);
                    }
                }
            }

            // Handle Attachments
            if ($request->hasFile('attachments')) {
                foreach ($request->file('attachments') as $file) {
                    $path = $file->store('invoice_attachments', 'public');
                    $invoice->attachments()->create([
                        'file_path' => $path,
                        'original_name' => $file->getClientOriginalName(),
                        'file_type' => $file->getMimeType(),
                        'file_size' => $file->getSize(),
                    ]);
                }
            }

            // Log activity
            ActivityLog::log('created', 'Invoice', $invoice->id, "Created {$invoice->business_type} Invoice #{$invoice->invoice_no}", [
                'invoice_no' => $invoice->invoice_no,
                'business_type' => $invoice->business_type,
                'total_amount' => $invoice->total_amount,
            ]);

            return response()->json($invoice->load(['items', 'lrs', 'attachments']), 201);
        });
    }

    public function show(Invoice $invoice)
    {
        return response()->json($invoice->load(['customer', 'items', 'lrs', 'attachments', 'billingParty', 'state']));
    }

    public function update(Request $request, Invoice $invoice)
    {
        $request->validate([
            'business_type' => 'required|string|in:BEIL,PI',
            'invoice_no' => 'required|string|max:255|unique:invoices,invoice_no,' . $invoice->id,
            'invoice_date' => 'required|date',
            'billing_party_id' => 'required|exists:billing_parties,id',
            'customer_id' => 'nullable|exists:customers,id',
            'delivery_address' => 'nullable|string',
            'state_id' => 'required|exists:states,id',
            'state_code' => 'nullable|string',
            'gst_number' => 'nullable|string',
            'po_number' => 'nullable|string',
            'payment_due_date' => 'nullable|date',
            'subject' => 'nullable|string',
            'hsn_code' => 'nullable|string',

            // BEIL specific items
            'items' => 'required_if:business_type,BEIL|array',
            'items.*.description' => 'required|string',
            'items.*.sac_code' => 'nullable|string',
            'items.*.qty' => 'required|numeric',
            'items.*.unit' => 'required|string',
            'items.*.rate' => 'required|numeric',
            'items.*.cgst' => 'nullable|numeric',
            'items.*.sgst' => 'nullable|numeric',

            // PI specific LRs
            'lr_ids' => 'required_if:business_type,PI|array',
            'lr_ids.*' => 'exists:lrs,id',

            // PI specific line items
            'pi_items' => 'nullable|array',
            'pi_items.*.lr_id' => 'required|exists:lrs,id',
            'pi_items.*.lr_no' => 'required|string',
            'pi_items.*.distance_range' => 'nullable|string',
            'pi_items.*.qty_display' => 'required|string',
            'pi_items.*.actual_qty' => 'required|numeric',
            'pi_items.*.rate' => 'required|numeric',
            'pi_items.*.amount' => 'required|numeric',
            'pi_items.*.detention_days' => 'nullable|numeric',
            'pi_items.*.detention_rate' => 'nullable|numeric',
            'pi_items.*.detention_amount' => 'nullable|numeric',

            // Calculations
            'amount' => 'required|numeric',
            'gst_amount' => 'required|numeric',
            'sgst_amount' => 'required|numeric',
            'cgst_amount' => 'required|numeric',
            'total_amount' => 'required|numeric',
            'total_amount_words' => 'nullable|string',

            'attachments.*' => 'nullable|file|max:51200',
        ]);

        return DB::transaction(function () use ($request, $invoice) {
            $invoice->update($request->except(['items', 'lr_ids', 'attachments']));

            // Handle BEIL Items - delete old items and create new ones
            if ($request->business_type === 'BEIL') {
                $invoice->items()->delete();
                foreach ($request->items as $item) {
                    $item['amount'] = $item['qty'] * $item['rate'];
                    $item['total'] = $item['amount'] + ($item['cgst'] ?? 0) + ($item['sgst'] ?? 0);
                    $invoice->items()->create($item);
                }
            }

            // Handle PI LRs
            if ($request->business_type === 'PI') {
                $invoice->lrs()->sync($request->lr_ids);

                // Handle PI Line items - delete old items and create new ones
                $invoice->items()->delete();
                if ($request->has('pi_items') && is_array($request->pi_items)) {
                    foreach ($request->pi_items as $piItem) {
                        $invoice->items()->create([
                            'lr_id' => $piItem['lr_id'],
                            'lr_no' => $piItem['lr_no'],
                            'distance_range' => $piItem['distance_range'] ?? null,
                            'description' => "Transportation for LR {$piItem['lr_no']} (" . ($piItem['distance_range'] ?? '') . " Kms)",
                            'sac_code' => '996511',
                            'qty' => $piItem['actual_qty'], // Provide a numeric value for compatibility
                            'qty_display' => $piItem['qty_display'],
                            'actual_qty' => $piItem['actual_qty'],
                            'unit' => 'Per trip',
                            'rate' => $piItem['rate'],
                            'amount' => $piItem['amount'],
                            'cgst' => $piItem['amount'] * 0.09,
                            'sgst' => $piItem['amount'] * 0.09,
                            'total' => $piItem['amount'] * 1.18,
                            'detention_days' => $piItem['detention_days'] ?? 0,
                            'detention_rate' => $piItem['detention_rate'] ?? 0,
                            'detention_amount' => $piItem['detention_amount'] ?? 0,
                        ]);
                    }
                }
            }

            // Handle Attachments
            if ($request->hasFile('attachments')) {
                foreach ($request->file('attachments') as $file) {
                    $path = $file->store('invoice_attachments', 'public');
                    $invoice->attachments()->create([
                        'file_path' => $path,
                        'original_name' => $file->getClientOriginalName(),
                        'file_type' => $file->getMimeType(),
                        'file_size' => $file->getSize(),
                    ]);
                }
            }

            // Log activity
            ActivityLog::log('updated', 'Invoice', $invoice->id, "Updated {$invoice->business_type} Invoice #{$invoice->invoice_no}", [
                'invoice_no' => $invoice->invoice_no,
                'business_type' => $invoice->business_type,
            ]);

            return response()->json($invoice->load(['items', 'lrs', 'attachments']), 200);
        });
    }

    public function destroy(Invoice $invoice)
    {
        $invoiceNo = $invoice->invoice_no;
        $businessType = $invoice->business_type;

        $invoice->delete();

        // Log activity
        ActivityLog::log('deleted', 'Invoice', null, "Deleted {$businessType} Invoice #{$invoiceNo}", [
            'invoice_no' => $invoiceNo,
            'business_type' => $businessType,
        ]);
        return response()->json(['message' => 'Invoice deleted successfully']);
    }
}
