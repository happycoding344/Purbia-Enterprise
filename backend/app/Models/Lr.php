<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Lr extends Model
{
    use HasFactory;

    protected $fillable = [
        'financial_year',
        'lr_date',
        'location_from_id',
        'lr_no',
        'to_city_id',
        'from_city_id',
        'state_id',
        'delivery_place_id',
        'tax_paid_by',
        'billing_party_id',
        'consignor_id',
        'consignee_id',
        'vehicle_id',
        'receipt_type',
        'pref_no',

        // Part 2
        'manifest_no',
        'manifest_date',
        'inward_time',
        'outward_time',
        'distance',
        'delay_hours',
        'detention_days',
        'detention_rate',
        'total_detention_amount',

        // Part 4
        'gross_amount',
        'gst_percent',
        'sgst_amount',
        'cgst_amount',
        'total_amount',
    ];

    protected $casts = [
        'lr_date' => 'date',
        'manifest_date' => 'date',
        'inward_time' => 'datetime',
        'outward_time' => 'datetime',
        'detention_days' => 'decimal:2',
        'detention_rate' => 'decimal:2',
        'total_detention_amount' => 'decimal:2',
        'gross_amount' => 'decimal:2',
        'gst_percent' => 'decimal:2',
        'sgst_amount' => 'decimal:2',
        'cgst_amount' => 'decimal:2',
        'total_amount' => 'decimal:2',
    ];

    public function items()
    {
        return $this->hasMany(LrItem::class);
    }

    public function attachments()
    {
        return $this->hasMany(LrAttachment::class);
    }

    public function vehicle()
    {
        return $this->belongsTo(Vehicle::class);
    }

    public function locationFrom()
    {
        return $this->belongsTo(Location::class, 'location_from_id');
    }

    public function toCity()
    {
        return $this->belongsTo(City::class, 'to_city_id');
    }

    public function fromCity()
    {
        return $this->belongsTo(City::class, 'from_city_id');
    }

    public function state()
    {
        return $this->belongsTo(State::class);
    }

    public function deliveryPlace()
    {
        return $this->belongsTo(DeliveryPlace::class);
    }

    public function billingParty()
    {
        return $this->belongsTo(BillingParty::class);
    }

    public function consignor()
    {
        return $this->belongsTo(Consignor::class);
    }

    public function consignee()
    {
        return $this->belongsTo(Consignee::class);
    }
}
