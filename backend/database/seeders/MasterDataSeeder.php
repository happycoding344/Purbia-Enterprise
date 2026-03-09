<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\State;
use App\Models\City;
use App\Models\Location;
use App\Models\BillingParty;
use App\Models\Consignee;
use App\Models\Consignor;
use App\Models\DeliveryPlace;
use App\Models\Vehicle;
use App\Models\Customer;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class MasterDataSeeder extends Seeder
{
    public function run(): void
    {
        // States
        $states = [
            'Andhra Pradesh',
            'Arunachal Pradesh',
            'Assam',
            'Bihar',
            'Chhattisgarh',
            'Goa',
            'Gujarat',
            'Haryana',
            'Himachal Pradesh',
            'Jharkhand',
            'Karnataka',
            'Kerala',
            'Madhya Pradesh',
            'Maharashtra',
            'Manipur',
            'Meghalaya',
            'Mizoram',
            'Nagaland',
            'Odisha',
            'Punjab',
            'Rajasthan',
            'Sikkim',
            'Tamil Nadu',
            'Telangana',
            'Tripura',
            'Uttar Pradesh',
            'Uttarakhand',
            'West Bengal',
            'Andaman and Nicobar Islands',
            'Chandigarh',
            'Dadra and Nagar Haveli and Daman and Diu',
            'Delhi',
            'Jammu and Kashmir',
            'Ladakh',
            'Lakshadweep',
            'Puducherry'
        ];
        foreach ($states as $stateName) {
            State::updateOrCreate(['name' => $stateName]);
        }

        // Cities
        foreach (['Ankleshwar', 'Panoli', 'Dahej', 'Jhagadia', 'Bharuch', 'Surat', 'Vadodara'] as $cityName) {
            City::updateOrCreate(['name' => $cityName]);
        }

        // Locations
        foreach (['BEIL Plant 1', 'PI Ind Site 2', 'Nirma Ltd', 'GIDC Panoli'] as $locationName) {
            Location::updateOrCreate(['name' => $locationName]);
        }

        // Billing Parties
        foreach (['BEIL Industries', 'PI Industries', 'Nirma Limited', 'UPL Limited'] as $partyName) {
            BillingParty::updateOrCreate(['name' => $partyName]);
        }

        // Consignees & Consignors
        foreach (['Shreeji Chemicals', 'Maruti Logistics', 'Krishna Enterprises'] as $name) {
            Consignee::updateOrCreate(['name' => $name]);
            Consignor::updateOrCreate(['name' => $name]);
        }

        // Delivery Places
        foreach (['Plot No 123, GIDC', 'Sector 5, Industrial Area', 'Main Gate, SEZ'] as $place) {
            DeliveryPlace::updateOrCreate(['name' => $place]);
        }

        // Vehicles
        $vehicles = [
            ['registration_no' => 'GJ16AX1234', 'type' => 'Taurus', 'party_name' => 'Purbia Enterprise'],
            ['registration_no' => 'GJ06ZZ5678', 'type' => 'Mini Truck', 'party_name' => 'Purbia Enterprise'],
            ['registration_no' => 'MH01AA9999', 'type' => 'Trailer', 'party_name' => 'Purbia Enterprise'],
        ];
        foreach ($vehicles as $v) {
            Vehicle::updateOrCreate(['registration_no' => $v['registration_no']], $v);
        }

        // Customers
        $customers = [
            ['name' => 'BEIL Industries Ltd', 'email' => 'contact@beil.com', 'mobile' => '9898098980', 'gst_no' => '24AAAAA0000A1Z5'],
            ['name' => 'PI Industries Ltd', 'email' => 'info@piind.com', 'mobile' => '9900990099', 'gst_no' => '24BBBBB1111B1Z5'],
        ];
        foreach ($customers as $c) {
            Customer::updateOrCreate(['name' => $c['name']], $c);
        }
    }
}
