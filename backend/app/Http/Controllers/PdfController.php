<?php

namespace App\Http\Controllers;

use App\Models\Invoice;
use Illuminate\Http\Request;

class PdfController extends Controller
{
    /**
     * Convert number to words (Indian system) logic extracted from legacy beil-invoice.php
     */
    private function numberToIndianWords($number)
    {
        $no = floor($number);
        $point = round($number - $no, 2) * 100;
        $hundred = null;
        $digits_1 = array('', 'Hundred', 'Thousand', 'Lakh', 'Crore');
        $i = 0;
        $str = array();
        $words = array(
            0 => '',
            1 => 'One',
            2 => 'Two',
            3 => 'Three',
            4 => 'Four',
            5 => 'Five',
            6 => 'Six',
            7 => 'Seven',
            8 => 'Eight',
            9 => 'Nine',
            10 => 'Ten',
            11 => 'Eleven',
            12 => 'Twelve',
            13 => 'Thirteen',
            14 => 'Fourteen',
            15 => 'Fifteen',
            16 => 'Sixteen',
            17 => 'Seventeen',
            18 => 'Eighteen',
            19 => 'Nineteen',
            20 => 'Twenty',
            30 => 'Thirty',
            40 => 'Forty',
            50 => 'Fifty',
            60 => 'Sixty',
            70 => 'Seventy',
            80 => 'Eighty',
            90 => 'Ninety'
        );
        while ($i < strlen($no)) {
            $i++;
        }
        $divider = 1000;
        $counter = 1;
        $string = array();
        while ($no > 0) {
            if ($counter == 1) {
                $divider = 1000;
            } elseif ($counter == 2) {
                $divider = 100;
            } else {
                $divider = 100;
            }

            $number = $no % $divider;
            $no = (int) ($no / $divider);

            $plural = (($number > 9) && $counter) ? '' : null;
            $hundred = ($counter == 2 && $number) ? 'Hundred ' : null;

            if ($number) {
                $counter_text = '';
                if ($counter == 1) {
                    $counter_text = '';
                } elseif ($counter == 2) {
                    $counter_text = '';
                } elseif ($counter == 3) {
                    $counter_text = 'Thousand ';
                } elseif ($counter == 4) {
                    $counter_text = 'Lakh ';
                } elseif ($counter == 5) {
                    $counter_text = 'Crore ';
                }

                $n = $number % 100;
                $p = (int) ($number / 100);
                $t = ($n < 21) ? $words[$n] : $words[10 * (int) ($n / 10)] . ' ' . $words[$n % 10];
                $string[] = ($p ? $words[$p] . ' Hundred ' : '') . $t . ' ' . $counter_text;
            }
            $counter++;
            if ($counter > 5)
                break;
        }
        $result = implode('', array_reverse($string));
        $points = ($point) ? "and " . $words[$point - $point % 10] . ' ' . $words[$point % 10] . ' Paise' : '';
        $result = trim(preg_replace('/\s+/', ' ', $result));
        if ($result === '')
            $result = 'Zero';
        return $result . ' Only';
    }

    public function generateInvoice(Invoice $invoice)
    {
        $invoice->load(['customer', 'items', 'trips']);
        $amount_words = $this->numberToIndianWords(round($invoice->grand_total));

        // Note: For a real production app, you would use barryvdh/laravel-dompdf
        // e.g. $pdf = PDF::loadView('pdf.invoice', compact('invoice', 'amount_words'));
        // return $pdf->download("invoice-{$invoice->invoice_no}.pdf");

        // Here we can either render the HTML directly for the frontend to print,
        // or just return the data required to build the pure-frontend print view.
        // Returning JSON so the React frontend can render the print view!
        return response()->json([
            'invoice' => $invoice,
            'amount_words' => $amount_words,
            'company' => [
                'name' => 'BEIL Infrastructure Ltd',
                'address' => "GIDC, Dahej, Taluka; Vag\nDistrict - Bharuch GUJRAT - 392130",
            ]
        ]);
    }
}
