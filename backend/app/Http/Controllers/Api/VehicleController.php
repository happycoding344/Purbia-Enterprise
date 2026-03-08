<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Vehicle;
use Illuminate\Http\Request;

class VehicleController extends Controller
{
    public function index()
    {
        return response()->json(Vehicle::with('attachments')->orderBy('registration_no')->get());
    }

    public function store(Request $request)
    {
        $request->validate([
            'registration_no' => 'required|string|max:255|unique:vehicles,registration_no',
            'type' => 'nullable|string|max:255',
            'party_name' => 'nullable|string|max:255',
            'owner_name' => 'nullable|string|max:255',
            'mobile_number' => 'nullable|string|max:255',
            'fitness_initial' => 'nullable|date',
            'fitness_expiry' => 'nullable|date',
            'puc_initial' => 'nullable|date',
            'puc_expiry' => 'nullable|date',
            'insurance_number' => 'nullable|string|max:255',
            'insurance_initial' => 'nullable|date',
            'insurance_expiry' => 'nullable|date',
            'national_permit_initial' => 'nullable|date',
            'national_permit_expiry' => 'nullable|date',
            'state_permit_initial' => 'nullable|date',
            'state_permit_expiry' => 'nullable|date',
            'gps_initial' => 'nullable|date',
            'gps_expiry' => 'nullable|date',
            'tax_lifetime' => 'boolean',
            'attachments.*' => 'nullable|file|max:51200', // 50MB per file
        ]);

        $vehicle = Vehicle::create($request->except('attachments'));

        if ($request->hasFile('attachments')) {
            foreach ($request->file('attachments') as $file) {
                $path = $file->store('vehicle_attachments', 'public');
                $vehicle->attachments()->create([
                    'file_path' => $path,
                    'original_name' => $file->getClientOriginalName(),
                    'file_type' => $file->getMimeType(),
                    'file_size' => $file->getSize(),
                ]);
            }
        }

        return response()->json($vehicle->load('attachments'), 201);
    }

    public function update(Request $request, Vehicle $vehicle)
    {
        $request->validate([
            'registration_no' => 'required|string|max:255|unique:vehicles,registration_no,' . $vehicle->id,
            'type' => 'nullable|string|max:255',
            'party_name' => 'nullable|string|max:255',
            'owner_name' => 'nullable|string|max:255',
            'mobile_number' => 'nullable|string|max:255',
            'fitness_initial' => 'nullable|date',
            'fitness_expiry' => 'nullable|date',
            'puc_initial' => 'nullable|date',
            'puc_expiry' => 'nullable|date',
            'insurance_number' => 'nullable|string|max:255',
            'insurance_initial' => 'nullable|date',
            'insurance_expiry' => 'nullable|date',
            'national_permit_initial' => 'nullable|date',
            'national_permit_expiry' => 'nullable|date',
            'state_permit_initial' => 'nullable|date',
            'state_permit_expiry' => 'nullable|date',
            'gps_initial' => 'nullable|date',
            'gps_expiry' => 'nullable|date',
            'tax_lifetime' => 'boolean',
            'attachments.*' => 'nullable|file|max:51200',
        ]);

        $vehicle->update($request->except('attachments'));

        if ($request->hasFile('attachments')) {
            foreach ($request->file('attachments') as $file) {
                $path = $file->store('vehicle_attachments', 'public');
                $vehicle->attachments()->create([
                    'file_path' => $path,
                    'original_name' => $file->getClientOriginalName(),
                    'file_type' => $file->getMimeType(),
                    'file_size' => $file->getSize(),
                ]);
            }
        }

        return response()->json($vehicle->load('attachments'));
    }

    public function destroy(Vehicle $vehicle)
    {
        $vehicle->delete();
        return response()->json(null, 204);
    }
}
