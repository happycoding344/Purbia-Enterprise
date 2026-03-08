<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class MasterController extends Controller
{
    protected $models = [
        'locations' => \App\Models\Location::class,
        'cities' => \App\Models\City::class,
        'states' => \App\Models\State::class,
        'delivery_places' => \App\Models\DeliveryPlace::class,
        'billing_parties' => \App\Models\BillingParty::class,
        'consignors' => \App\Models\Consignor::class,
        'consignees' => \App\Models\Consignee::class,
    ];

    public function index($type)
    {
        if (!isset($this->models[$type])) {
            return response()->json(['error' => 'Invalid type'], 404);
        }

        return response()->json($this->models[$type]::orderBy('name')->get());
    }

    public function store(Request $request, $type)
    {
        if (!isset($this->models[$type])) {
            return response()->json(['error' => 'Invalid type'], 404);
        }

        $request->validate([
            'name' => 'required|string|max:255|unique:' . $type . ',name',
        ]);

        $item = $this->models[$type]::create([
            'name' => $request->name,
        ]);

        return response()->json($item, 201);
    }
}
