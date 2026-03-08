<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Vehicle extends Model
{
    use HasFactory;

    protected $fillable = [
        'registration_no',
        'type',
        'party_name',
        'owner_name',
        'mobile_number',
        'fitness_initial',
        'fitness_expiry',
        'puc_initial',
        'puc_expiry',
        'insurance_number',
        'insurance_initial',
        'insurance_expiry',
        'national_permit_initial',
        'national_permit_expiry',
        'state_permit_initial',
        'state_permit_expiry',
        'gps_initial',
        'gps_expiry',
        'tax_lifetime',
    ];

    public function lrs()
    {
        return $this->hasMany(Lr::class);
    }

    public function attachments()
    {
        return $this->hasMany(VehicleAttachment::class);
    }
}
