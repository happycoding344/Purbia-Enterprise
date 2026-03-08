<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class VehicleAttachment extends Model
{
    use HasFactory;

    protected $fillable = [
        'vehicle_id',
        'file_path',
        'original_name',
        'file_type',
        'file_size',
    ];

    public function vehicle()
    {
        return $this->belongsTo(Vehicle::class);
    }
}
