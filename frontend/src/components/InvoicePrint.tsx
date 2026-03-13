import React from 'react';

interface InvoicePrintProps {
    invoice: any;
    businessType: 'BEIL' | 'PI';
    containerId?: string;
}

export const InvoicePrint: React.FC<InvoicePrintProps> = ({ invoice, businessType, containerId = 'invoice-print-container' }) => {
    // Helper to format currency
    const fmt = (val: number) => new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val || 0);

    const isBEIL = businessType === 'BEIL';

    return (
        <div id={containerId} className="bg-white p-0 m-0 font-sans text-[8pt] leading-tight" style={{ width: '210mm', minHeight: '297mm', margin: '0 auto', boxSizing: 'border-box' }}>
            {/* Header */}
            <header className="mb-2">
                <img
                    src="/header-1.jpg"
                    alt="Header"
                    className="w-full h-auto max-h-[90px] object-contain mx-auto"
                />
            </header>

            <div className="px-6">
                <h5 className="text-center font-bold text-sm mb-2 underline">TAX INVOICE</h5>

                {/* Header Table */}
                <table className="w-full border-collapse border border-black mb-2 text-[8pt]">
                    <tbody>
                        <tr>
                            <td className="border border-black p-1 font-bold" colSpan={2}>
                                {isBEIL ? 'BEIL Infrastructure Ltd' : 'PI Industries Ltd.'}
                            </td>
                            <td className="border border-black p-1 font-bold w-1/4">Invoice No.</td>
                            <td className="border border-black p-1 w-1/4">{invoice.invoice_no}</td>
                        </tr>
                        <tr>
                            <td className="border border-black p-1 h-12 align-top text-[7pt]" colSpan={2}>
                                <div className="font-bold mb-0.5">Billing Party:</div>
                                {invoice.billing_party}
                                <br />
                                {invoice.delivery_address}
                            </td>
                            <td className="border border-black p-1 font-bold">Invoice date</td>
                            <td className="border border-black p-1">{invoice.invoice_date}</td>
                        </tr>
                        <tr>
                            <td className="border border-black p-1 font-bold">GSTIN</td>
                            <td className="border border-black p-1 text-[7pt]">{invoice.billing_party_gstin || invoice.gst_number || '-'}</td>
                            <td className="border border-black p-1 font-bold">PO No.</td>
                            <td className="border border-black p-1">{invoice.po_number}</td>
                        </tr>
                        <tr>
                            <td className="border border-black p-1 font-bold">
                                State Name: {invoice.state}
                            </td>
                            <td className="border border-black p-1">Code: {invoice.state_code}</td>
                            <td className="border border-black p-1 font-bold">Payment due</td>
                            <td className="border border-black p-1">{invoice.payment_due_date}</td>
                        </tr>
                    </tbody>
                </table>

                <p className="mb-2 text-[7pt]"><strong>Subject:</strong> {invoice.subject || 'Detention Charges'}</p>

                {/* Items Table */}
                <table className="w-full border-collapse border border-black text-[7pt] mb-2">
                    <thead>
                        <tr className="bg-gray-100">
                            <th className="border border-black p-0.5 text-center w-8">Sr. No.</th>
                            <th className="border border-black p-0.5 text-left text-[6.5pt]">
                                {isBEIL ? 'Item Description' : 'Detail of Vehicles (Date, LR No, Manifest, Vehicle)'}
                            </th>
                            {!isBEIL && <th className="border border-black p-0.5 text-left text-[6.5pt]">Particulars of Service</th>}
                            <th className="border border-black p-0.5 text-center">SAC Code</th>
                            <th className="border border-black p-0.5 text-center">Qty</th>
                            <th className="border border-black p-0.5 text-center">Unit</th>
                            <th className="border border-black p-0.5 text-right">Unit Rate</th>
                            <th className="border border-black p-0.5 text-right">Amount (Rs.)</th>
                            <th className="border border-black p-0.5 text-right w-16">CGST @ 9%</th>
                            <th className="border border-black p-0.5 text-right w-16">SGST @ 9%</th>
                            <th className="border border-black p-0.5 text-right">Total Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        {invoice.items && invoice.items.length > 0 ? (
                            <>
                                {invoice.items.map((item: any, idx: number) => (
                                    <tr key={idx}>
                                        <td className="border border-black p-0.5 text-center">{idx + 1}</td>
                                        <td className="border border-black p-0.5 text-[6.5pt]">
                                            {isBEIL ? (
                                                item.description
                                            ) : (
                                                <div>
                                                    <strong>Date:</strong> {item.lr_date || '-'}<br />
                                                    <strong>LR:</strong> {item.lr_no || '-'}<br />
                                                    <strong>Manif:</strong> {item.manifest_no || '-'}<br />
                                                    <strong>Veh:</strong> {item.vehicle_no || '-'}
                                                </div>
                                            )}
                                        </td>
                                        {!isBEIL && (
                                            <td className="border border-black p-0.5 text-[6.5pt]">
                                                {item.description}
                                                {item.detention_days > 0 && (
                                                    <div className="mt-1 font-bold text-orange-700">
                                                        Detention: {item.detention_days} Days @ ₹{item.detention_rate}/day (₹{item.detention_amount})
                                                    </div>
                                                )}
                                            </td>
                                        )}
                                        <td className="border border-black p-0.5 text-center">{item.sac_code}</td>
                                        <td className="border border-black p-0.5 text-center">
                                            {isBEIL ? item.qty : (item.actual_qty || item.qty)}
                                        </td>
                                        <td className="border border-black p-0.5 text-center">{item.unit}</td>
                                        <td className="border border-black p-0.5 text-right">{fmt(item.unit_rate || item.rate)}</td>
                                        <td className="border border-black p-0.5 text-right">{fmt(item.amount)}</td>
                                        <td className="border border-black p-0.5 text-right">{fmt(item.cgst)}</td>
                                        <td className="border border-black p-0.5 text-right">{fmt(item.sgst)}</td>
                                        <td className="border border-black p-0.5 text-right">{fmt(item.total || item.total_amount)}</td>
                                    </tr>
                                ))}
                                {/* PI Industries Totals Row */}
                                {!isBEIL && (
                                    <tr className="bg-gray-50 font-bold">
                                        <td className="border border-black p-1 text-right" colSpan={3}>TOTAL:</td>
                                        <td className="border border-black p-1 text-center font-bold">-</td>
                                        <td className="border border-black p-1 text-center font-bold">
                                            {invoice.items.reduce((s: number, i: any) => s + (parseFloat(i.actual_qty) || 0), 0).toFixed(2)}
                                        </td>
                                        <td className="border border-black p-1 text-center">-</td>
                                        <td className="border border-black p-1 text-right">-</td>
                                        <td className="border border-black p-1 text-right">{fmt(invoice.total_amount_before_tax || invoice.amount)}</td>
                                        <td className="border border-black p-1 text-right">{fmt(invoice.cgst_total || (invoice.tax_amount / 2))}</td>
                                        <td className="border border-black p-1 text-right">{fmt(invoice.sgst_total || (invoice.tax_amount / 2))}</td>
                                        <td className="border border-black p-1 text-right">{fmt(invoice.grand_total || invoice.total_amount)}</td>
                                    </tr>
                                )}
                            </>
                        ) : (
                            <tr>
                                <td colSpan={isBEIL ? 10 : 11} className="border border-black p-2 text-center text-gray-400 italic">No items listed</td>
                            </tr>
                        )}
                    </tbody>
                </table>

                {/* Footer Section */}
                {!isBEIL && <p className="text-[6pt] mb-1">*Minimum Quantity</p>}

                <table className="w-full border-collapse border border-black text-[7pt]">
                    <tbody>
                        <tr>
                            <td className="border border-black p-0.5 font-bold w-1/4" colSpan={2}>Bank Details</td>
                            <td className="border border-black p-0.5 font-bold">TOTAL</td>
                            <td className="border border-black p-0.5 text-right font-bold">{fmt(invoice.total_amount_before_tax || invoice.amount)}</td>
                        </tr>
                        <tr>
                            <td className="border border-black p-0.5 font-bold w-1/6">Name</td>
                            <td className="border border-black p-0.5 text-[6.5pt]">PURBIA ENTERPRISE</td>
                            <td className="border border-black p-0.5 font-bold">SGST @ 9%</td>
                            <td className="border border-black p-0.5 text-right">{fmt(invoice.sgst_total || (invoice.tax_amount / 2))}</td>
                        </tr>
                        <tr>
                            <td className="border border-black p-0.5 font-bold">IFSC Code</td>
                            <td className="border border-black p-0.5 text-[6.5pt]">AUBL0002129</td>
                            <td className="border border-black p-0.5 font-bold">CGST @ 9%</td>
                            <td className="border border-black p-0.5 text-right">{fmt(invoice.cgst_total || (invoice.tax_amount / 2))}</td>
                        </tr>
                        <tr>
                            <td className="border border-black p-0.5 font-bold">Account No.</td>
                            <td className="border border-black p-0.5 text-[6.5pt]">2121212937126385</td>
                            <td className="border border-black p-0.5 font-bold text-[8pt]">Total Amount</td>
                            <td className="border border-black p-0.5 text-right font-bold text-[8pt]">₹{fmt(invoice.grand_total || invoice.total_amount)}</td>
                        </tr>
                        <tr>
                            <td className="border border-black p-0.5 font-bold">Bank & Branch</td>
                            <td className="border border-black p-0.5 text-[6.5pt]">AU SMALL FINANCE BANK - Ankleshwar</td>
                            <td className="border border-black p-0.5 align-top text-[6.5pt]" colSpan={2} rowSpan={3}>
                                <strong>Total Rs. In Word:</strong>
                                <div className="mt-0.5 italic">{invoice.amount_in_words || '-'}</div>
                            </td>
                        </tr>
                        <tr>
                            <td className="border border-black p-0.5 font-bold">GSTIN</td>
                            <td className="border border-black p-0.5 text-[6.5pt]">24AJIPP3114D1ZO</td>
                        </tr>
                        <tr>
                            <td className="border border-black p-0.5 font-bold">PAN</td>
                            <td className="border border-black p-0.5 text-[6.5pt]">AJIPP3114D</td>
                        </tr>
                        <tr>
                            <td className="border border-black p-0.5 font-bold">HSN Code</td>
                            <td className="border border-black p-0.5 text-[6.5pt]" colSpan={3}>{invoice.hsn_code}</td>
                        </tr>
                    </tbody>
                </table>

                <div className="mt-2 text-right">
                    <p className="font-bold text-[7pt]">For, M/s PURBIA ENTERPRISE</p>
                    <div className="h-8 border-b border-gray-100 mb-1"></div>
                    <p className="font-bold text-[7pt] pr-2">Authorised Signatory</p>
                </div>
            </div>

            {/* Sticky Footer for A4 */}
            <footer className="mt-4">
                <img
                    src="/footer-1.jpg"
                    alt="Footer"
                    className="w-full h-auto max-h-[60px] object-contain mx-auto"
                />
            </footer>

            <style>{`
                @media print {
                    @page { 
                        size: A4; 
                        margin: 0mm; 
                    }
                    html, body {
                        margin: 0 !important;
                        padding: 0 !important;
                        height: 297mm !important;
                        overflow: hidden !important;
                        background: white !important;
                    }
                    /* Hide everything except the print container */
                    body > *:not(.print-root) {
                        display: none !important;
                    }
                    /* Target shadcn/radix dialog overlays and content */
                    [role="dialog"], 
                    .fixed, 
                    [data-state="open"],
                    .DialogContent {
                        position: static !important;
                        background: white !important;
                        box-shadow: none !important;
                        padding: 0 !important;
                        margin: 0 !important;
                        width: 100% !important;
                        height: 100% !important;
                        border: none !important;
                    }
                    /* Hide dialog header/title during print */
                    .no-print { display: none !important; }
                    
                    #invoice-print-container { 
                        width: 210mm !important; 
                        height: 297mm !important; 
                        padding: 0 !important;
                        margin: 0 auto !important;
                        position: relative !important;
                        box-sizing: border-box !important;
                        transform: scale(1);
                        transform-origin: top center;
                        page-break-after: avoid;
                        page-break-before: avoid;
                        border: none !important;
                    }
                    header { position: absolute; top: 0; width: 100%; border: none !important; }
                    footer { position: absolute; bottom: 0; width: 100%; border: none !important; }
                    .px-6 { padding-top: 100px; padding-bottom: 70px; }
                    
                    /* Table and font fixes */
                    table { border-collapse: collapse !important; width: 100% !important; }
                    td, th { border: 1px solid black !important; }
                    
                    /* Force single page */
                    * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                }
                /* Signature block styling */
                .signature-block {
                    margin-top: 2rem;
                    text-align: right;
                }
            `}</style>
        </div>
    );
};
