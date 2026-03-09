import React from 'react';

interface InvoicePrintProps {
    invoice: any;
    businessType: 'BEIL' | 'PI';
}

export const InvoicePrint: React.FC<InvoicePrintProps> = ({ invoice, businessType }) => {
    // Helper to format currency
    const fmt = (val: number) => new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val || 0);

    const isBEIL = businessType === 'BEIL';

    return (
        <div id="invoice-print-container" className="bg-white p-0 m-0 font-sans text-[10pt] leading-tight" style={{ width: '210mm', minHeight: '297mm', margin: '0 auto', boxSizing: 'border-box' }}>
            {/* Header */}
            <header className="mb-4">
                <img
                    src="https://purbiaenterprise.com/wp-content/uploads/2025/06/header-1.jpg"
                    alt="Header"
                    className="w-full h-auto max-h-[120px] object-contain mx-auto"
                />
            </header>

            <div className="px-8">
                <h5 className="text-center font-bold text-lg mb-4 underline">TAX INVOICE</h5>

                {/* Header Table */}
                <table className="w-full border-collapse border border-black mb-4">
                    <tbody>
                        <tr>
                            <td className="border border-black p-2 font-bold" colSpan={2}>
                                {isBEIL ? 'BEIL Infrastructure Ltd' : 'PI Industries Ltd.'}
                            </td>
                            <td className="border border-black p-2 font-bold w-1/4">Invoice No.</td>
                            <td className="border border-black p-2 w-1/4">{invoice.invoice_no}</td>
                        </tr>
                        <tr>
                            <td className="border border-black p-2 h-16 align-top" colSpan={2}>
                                <div className="font-bold mb-1">Billing Party:</div>
                                {invoice.billing_party}
                                <br />
                                {invoice.delivery_address}
                            </td>
                            <td className="border border-black p-2 font-bold">Invoice date</td>
                            <td className="border border-black p-2">{invoice.invoice_date}</td>
                        </tr>
                        <tr>
                            <td className="border border-black p-2 font-bold">GSTIN</td>
                            <td className="border border-black p-2">{invoice.billing_party_gstin || invoice.gst_number || '-'}</td>
                            <td className="border border-black p-2 font-bold">PO No.</td>
                            <td className="border border-black p-2">{invoice.po_number}</td>
                        </tr>
                        <tr>
                            <td className="border border-black p-2 font-bold">
                                State Name: {invoice.state}
                            </td>
                            <td className="border border-black p-2">Code: {invoice.state_code}</td>
                            <td className="border border-black p-2 font-bold">Payment due</td>
                            <td className="border border-black p-2">{invoice.payment_due_date}</td>
                        </tr>
                    </tbody>
                </table>

                <p className="mb-4"><strong>Subject:</strong> {invoice.subject || 'Detention Charges'}</p>

                {/* Items Table */}
                <table className="w-full border-collapse border border-black text-[9pt] mb-4">
                    <thead>
                        <tr className="bg-gray-100">
                            <th className="border border-black p-1 text-center w-10">Sr. No.</th>
                            <th className="border border-black p-1 text-left">Item Description</th>
                            <th className="border border-black p-1 text-center">SAC Code</th>
                            <th className="border border-black p-1 text-center">Qty</th>
                            <th className="border border-black p-1 text-center">Unit</th>
                            <th className="border border-black p-1 text-right">Unit Rate</th>
                            <th className="border border-black p-1 text-right">Amount (Rs.)</th>
                            <th className="border border-black p-1 text-right w-20">CGST @ 9%</th>
                            <th className="border border-black p-1 text-right w-20">SGST @ 9%</th>
                            <th className="border border-black p-1 text-right">Total Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        {invoice.items && invoice.items.length > 0 ? (
                            invoice.items.map((item: any, idx: number) => (
                                <tr key={idx}>
                                    <td className="border border-black p-1 text-center">{idx + 1}</td>
                                    <td className="border border-black p-1">{item.description}</td>
                                    <td className="border border-black p-1 text-center">{item.sac_code}</td>
                                    <td className="border border-black p-1 text-center">{item.qty}</td>
                                    <td className="border border-black p-1 text-center">{item.unit}</td>
                                    <td className="border border-black p-1 text-right">{fmt(item.unit_rate)}</td>
                                    <td className="border border-black p-1 text-right">{fmt(item.amount)}</td>
                                    <td className="border border-black p-1 text-right">{fmt(item.cgst)}</td>
                                    <td className="border border-black p-1 text-right">{fmt(item.sgst)}</td>
                                    <td className="border border-black p-1 text-right">{fmt(item.total_amount)}</td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={10} className="border border-black p-4 text-center text-gray-400 italic">No items listed</td>
                            </tr>
                        )}
                        {/* Reduced filler rows to prevent overflow */}
                        <tr className="h-24">
                            <td className="border border-black p-1"></td>
                            <td className="border border-black p-1"></td>
                            <td className="border border-black p-1"></td>
                            <td className="border border-black p-1"></td>
                            <td className="border border-black p-1"></td>
                            <td className="border border-black p-1"></td>
                            <td className="border border-black p-1"></td>
                            <td className="border border-black p-1"></td>
                            <td className="border border-black p-1"></td>
                            <td className="border border-black p-1"></td>
                        </tr>
                    </tbody>
                </table>

                {/* Footer Section */}
                {!isBEIL && <p className="text-[8pt] mb-2">*Minimum Quantity</p>}

                <table className="w-full border-collapse border border-black text-[9pt]">
                    <tbody>
                        <tr>
                            <td className="border border-black p-2 font-bold w-1/4" colSpan={2}>Bank Details</td>
                            <td className="border border-black p-2 font-bold">TOTAL</td>
                            <td className="border border-black p-2 text-right font-bold">{fmt(invoice.total_amount_before_tax || invoice.amount)}</td>
                        </tr>
                        <tr>
                            <td className="border border-black p-1 font-bold w-1/6">Name</td>
                            <td className="border border-black p-1">PURBIA ENTERPRISE</td>
                            <td className="border border-black p-1 font-bold">SGST @ 9%</td>
                            <td className="border border-black p-1 text-right">{fmt(invoice.sgst_total || (invoice.tax_amount / 2))}</td>
                        </tr>
                        <tr>
                            <td className="border border-black p-1 font-bold">IFSC Code</td>
                            <td className="border border-black p-1">AUBL0002129</td>
                            <td className="border border-black p-1 font-bold">CGST @ 9%</td>
                            <td className="border border-black p-1 text-right">{fmt(invoice.cgst_total || (invoice.tax_amount / 2))}</td>
                        </tr>
                        <tr>
                            <td className="border border-black p-1 font-bold">Account No.</td>
                            <td className="border border-black p-1">2121212937126385</td>
                            <td className="border border-black p-1 font-bold text-base">Total Amount</td>
                            <td className="border border-black p-1 text-right font-bold text-base">₹{fmt(invoice.grand_total || invoice.total_amount)}</td>
                        </tr>
                        <tr>
                            <td className="border border-black p-1 font-bold">Bank & Branch</td>
                            <td className="border border-black p-1">AU SMALL FINANCE BANK - Ankleshwar</td>
                            <td className="border border-black p-1 align-top" colSpan={2} rowSpan={3}>
                                <strong>Total Rs. In Word:</strong>
                                <div className="mt-1 italic">{invoice.amount_in_words || '-'}</div>
                            </td>
                        </tr>
                        <tr>
                            <td className="border border-black p-1 font-bold">GSTIN</td>
                            <td className="border border-black p-1 text-sm">24AJIPP3114D1ZO</td>
                        </tr>
                        <tr>
                            <td className="border border-black p-1 font-bold">PAN</td>
                            <td className="border border-black p-1">AJIPP3114D</td>
                        </tr>
                        <tr>
                            <td className="border border-black p-1 font-bold">HSN Code</td>
                            <td className="border border-black p-1" colSpan={3}>{invoice.hsn_code}</td>
                        </tr>
                    </tbody>
                </table>

                <div className="mt-4 text-right">
                    <p className="font-bold text-[10pt]">For, M/s PURBIA ENTERPRISE</p>
                    <div className="h-12 border-b border-gray-100 mb-2"></div>
                    <p className="font-bold text-[10pt] pr-2">Authorised Signatory</p>
                </div>
            </div>

            {/* Sticky Footer for A4 */}
            <footer className="mt-8">
                <img
                    src="https://purbiaenterprise.com/wp-content/uploads/2025/06/footer-1.jpg"
                    alt="Footer"
                    className="w-full h-auto max-h-[80px] object-contain mx-auto"
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
                    .px-8 { padding-top: 135px; padding-bottom: 90px; }
                    
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
