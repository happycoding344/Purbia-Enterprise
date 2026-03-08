<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DeliveryPlace extends Model
{
    use HasFactory;
    protected $fillable = ['name'];

    public function lrs()
    {
        return $this->hasMany(Lr::class);
    }
}
