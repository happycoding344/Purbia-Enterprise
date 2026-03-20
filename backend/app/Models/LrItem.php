<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class LrItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'lr_id',
        'item_name',
        'unit',
        'rate_type',
        'qty',
        'weight',
        'rate',
        'net_amount',
        'actual_qty',
    ];

    protected $casts = [
        'qty' => 'decimal:2',
        'weight' => 'decimal:2',
        'rate' => 'decimal:2',
        'net_amount' => 'decimal:2',
    ];

    public function lr()
    {
        return $this->belongsTo(Lr::class);
    }
}
