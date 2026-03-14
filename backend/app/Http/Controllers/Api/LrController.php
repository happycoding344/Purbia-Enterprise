<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Lr;
use App\Models\LrItem;
use App\Models\LrAttachment;
use App\Models\ActivityLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Carbon\Carbon;

class LrController extends Controller
{
    public function index()
    {
        return response()->json(Lr::with(['items', 'vehicle', 'locationFrom', 'toCity', 'fromCity'])->orderBy('lr_date', 'desc')->get());
    }

    public function store(Request $request)
    {
        $request->validate([
            'financial_year' => 'required|string',
            'lr_date' => 'required|date',
            'location_from_id' => 'required|exists:locations,id',
            'lr_no' => 'required|string|unique:lrs,lr_no',
            'to_city_id' => 'required|exists:cities,id',
            'from_city_id' => 'required|exists:cities,id',
            'state_id' => 'required|exists:states,id',
            'delivery_place_id' => 'required|exists:delivery_places,id',
            'tax_paid_by' => 'required|string',
            'billing_party_id' => 'required|exists:billing_parties,id',
            'consignor_id' => 'required|exists:consignors,id',
            'consignee_id' => 'required|exists:consignees,id',
            'vehicle_id' => 'required|exists:vehicles,id',
            'receipt_type' => 'required|string',

            // Part 2
            'manifest_no' => 'nullable|string',
            'manifest_date' => 'nullable|date',
            'inward_time' => 'nullable|date',
            'outward_time' => 'nullable|date',
            'distance' => 'nullable|numeric',
            'delay_hours' => 'nullable|integer',
            'detention_rate' => 'nullable|numeric',

            // Items
            'items' => 'required|array|min:1',
            'items.*.item_name' => 'required|string',
            'items.*.unit' => 'required|string',
            'items.*.rate_type' => 'required|string',
            'items.*.qty' => 'nullable|numeric',
            'items.*.weight' => 'nullable|numeric',
            'items.*.rate' => 'required|numeric',

            // Part 4
            'gst_percent' => 'nullable|numeric',

            // Files
            'attachments.*' => 'nullable|file|max:51200', // 50MB
        ]);

        try {
            return DB::transaction(function () use ($request) {
                // Auto calculate detention and amounts
                $data = $request->except(['items', 'attachments']);

                // Pref No generation logic - find max existing number globally to avoid duplicates
                $maxPrefNo = Lr::selectRaw("MAX(CAST(SUBSTRING(pref_no, 6) AS UNSIGNED)) as max_num")
                    ->value('max_num');
                $data['pref_no'] = 'PREF-' . (($maxPrefNo ?? 0) + 1);

                // Calculations
                if ($request->inward_time && $request->outward_time) {
                    $in = Carbon::parse($request->inward_time);
                    $out = Carbon::parse($request->outward_time);
                    $diffDays = $in->diffInDays($out);

                    $delayDays = ($request->delay_hours ?: 0);
                    $detentionDays = max(0, $diffDays - $delayDays);

                    $data['detention_days'] = $detentionDays;
                    $data['total_detention_amount'] = $detentionDays * ($request->detention_rate ?: 0);
                }

                $lr = Lr::create($data);

                // Process Items and Net Amount
                $netTotal = 0;
                $items = $request->input('items', []);
                foreach ($items as $itemData) {
                    $qtyVal = ($itemData['rate_type'] == 'Qty') ? ($itemData['qty'] ?? 0) : ($itemData['weight'] ?? 0);
                    $itemData['net_amount'] = $qtyVal * $itemData['rate'];
                    $netTotal += $itemData['net_amount'];

                    $lr->items()->create($itemData);
                }

                // Part 4 Calculations
                $gross = ($data['total_detention_amount'] ?? 0) + $netTotal;
                $gstP = $request->gst_percent ?: 0;
                $gstAmt = $gross * ($gstP / 100);

                $lr->update([
                    'gross_amount' => $gross,
                    'sgst_amount' => $gstAmt / 2,
                    'cgst_amount' => $gstAmt / 2,
                    'total_amount' => $gross + $gstAmt
                ]);

                // Process Attachments
                if ($request->hasFile('attachments')) {
                    foreach ($request->file('attachments') as $file) {
                        $path = $file->store('lr_attachments', 'public');
                        $lr->attachments()->create([
                            'file_path' => $path,
                            'file_name' => $file->getClientOriginalName(),
                            'file_size' => $file->getSize(),
                        ]);
                    }
                }

                // Log activity
                ActivityLog::log('created', 'LR', $lr->id, "Created LR #{$lr->lr_no} for {$lr->financial_year}", [
                    'lr_no' => $lr->lr_no,
                    'financial_year' => $lr->financial_year,
                    'total_amount' => $lr->total_amount,
                ]);

                return response()->json($lr->load('items', 'attachments'), 201);
            });
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to create LR: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function show(Lr $lr)
    {
        return response()->json($lr->load(['items', 'attachments', 'vehicle', 'locationFrom', 'toCity', 'fromCity', 'state', 'deliveryPlace', 'billingParty', 'consignor', 'consignee']));
    }
}
