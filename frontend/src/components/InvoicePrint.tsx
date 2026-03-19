import React from 'react';

interface InvoicePrintProps {
    invoice: any;
    businessType: 'BEIL' | 'PI';
    containerId?: string;
}

export const InvoicePrint: React.FC<InvoicePrintProps> = ({
    invoice,
    businessType,
    containerId = 'invoice-print-container',
}) => {
    const isBEIL = businessType === 'BEIL';

    const fmt = (val: number | string | undefined | null) =>
        new Intl.NumberFormat('en-IN', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(Number(val) || 0);

    const fmtDate = (raw: string | undefined | null): string => {
        if (!raw) return '-';
        try {
            const d = new Date(raw);
            if (isNaN(d.getTime())) return raw;
            const dd = String(d.getDate()).padStart(2, '0');
            const mm = String(d.getMonth() + 1).padStart(2, '0');
            const yyyy = d.getFullYear();
            return `${dd}/${mm}/${yyyy}`;
        } catch {
            return raw;
        }
    };

    const cell: React.CSSProperties = {
        border: '1px solid black',
        padding: '5px 8px',
        fontSize: '10px',
        verticalAlign: 'middle',
    };
    const cellBold: React.CSSProperties = { ...cell, fontWeight: 700 };
    const cellRight: React.CSSProperties = { ...cell, textAlign: 'right' };
    const cellCenter: React.CSSProperties = { ...cell, textAlign: 'center' };
    const cellHeader: React.CSSProperties = {
        ...cell,
        fontWeight: 700,
        backgroundColor: '#f3f4f6',
        textAlign: 'center',
    };

    const tbl: React.CSSProperties = {
        width: '100%',
        borderCollapse: 'collapse',
        tableLayout: 'fixed',
    };

    const containerStyle: React.CSSProperties = {
        width: '794px', // Exactly 210mm at 96 DPI to match html2canvas options
        minHeight: '1123px', // Exactly 297mm at 96 DPI
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: '"Inter", "Roboto", Arial, sans-serif',
        backgroundColor: 'white',
        color: '#000',
        margin: '0 auto', // Centering it just in case
        position: 'relative'
    };

    const bodyStyle: React.CSSProperties = {
        flex: 1,
        padding: '10px 30px', // Proper left/right padding for readability
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
    };

    return (
        <div id={containerId} className="print-root" style={containerStyle}>
            {/* INJECT FONT */}
            <style dangerouslySetInnerHTML={{__html: `
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap');
                /* Make sure the element itself limits widths of internal tables correctly */
                #${containerId} * {
                    box-sizing: border-box;
                }
            `}} />

            {/* HEADER IMAGE */}
            <div style={{ width: '100%', flexShrink: 0, 
                          display: 'flex', justifyContent: 'center',
                          padding: '0' }}>
                {/* Changed to object-fit contain so it scales naturally without stretching */}
                <img
                    src="/header-1.jpg"
                    alt="Header"
                    style={{ width: '100%', height: 'auto', display: 'block', objectFit: 'contain' }}
                />
            </div>

            {/* BODY CONTENT */}
            <div style={bodyStyle}>

                <div style={{ textAlign: 'center', fontWeight: 800, fontSize: '14px', textDecoration: 'underline', letterSpacing: 1, marginBottom: 5 }}>
                    TAX INVOICE
                </div>

                {/* Header Info Table */}
                <table style={tbl}>
                    <colgroup>
                        <col style={{ width: '30%' }} />
                        <col style={{ width: '20%' }} />
                        <col style={{ width: '22%' }} />
                        <col style={{ width: '28%' }} />
                    </colgroup>
                    <tbody>
                        <tr>
                            <td colSpan={2} style={{ ...cellBold, fontSize: '11px' }}>
                                {isBEIL ? 'BEIL Infrastructure Ltd.' : 'PI Industries Ltd.'}
                            </td>
                            <td style={{...cellBold, fontSize: '10px'}}>Invoice No.</td>
                            <td style={cell}>{invoice.invoice_no}</td>
                        </tr>
                        <tr>
                            <td colSpan={2} style={{ ...cell, verticalAlign: 'top', minHeight: '40px' }}>
                                <span style={{ fontWeight: 700 }}>Billing Party: </span>
                                {invoice.billing_party}
                                {invoice.delivery_address && (
                                    <><br />{invoice.delivery_address}</>
                                )}
                            </td>
                            <td style={cellBold}>Invoice Date</td>
                            <td style={cell}>{fmtDate(invoice.invoice_date)}</td>
                        </tr>
                        <tr>
                            <td style={cellBold}>GSTIN</td>
                            <td style={cell}>{invoice.billing_party_gstin || invoice.gst_number || '-'}</td>
                            <td style={cellBold}>PO No.</td>
                            <td style={cell}>{invoice.po_number || '-'}</td>
                        </tr>
                        <tr>
                            <td style={cellBold}>State Name</td>
                            <td style={cell}>{invoice.state || '-'}</td>
                            <td style={cellBold}>State Code</td>
                            <td style={cell}>{invoice.state_code || '-'}</td>
                        </tr>
                        <tr>
                            <td style={cellBold}>Payment Due Date</td>
                            <td style={cell}>{fmtDate(invoice.payment_due_date)}</td>
                            <td style={cellBold}>HSN Code</td>
                            <td style={cell}>{invoice.hsn_code || '-'}</td>
                        </tr>
                    </tbody>
                </table>

                {invoice.subject && (
                    <div style={{ fontSize: '10px', margin: '4px 0' }}>
                        <strong>Subject: </strong>{invoice.subject}
                    </div>
                )}

                {/* Items Table */}
                {isBEIL ? (
                    /* ── BEIL: Original format ────────────────── */
                    <table style={{ ...tbl }}>
                        <colgroup>
                            <col style={{ width: '6%' }} />
                            <col style={{ width: '34%' }} />
                            <col style={{ width: '9%' }} />
                            <col style={{ width: '6%' }} />
                            <col style={{ width: '7%' }} />
                            <col style={{ width: '9%' }} />
                            <col style={{ width: '10%' }} />
                            <col style={{ width: '8%' }} />
                            <col style={{ width: '8%' }} />
                            <col style={{ width: '11%' }} />
                        </colgroup>
                        <thead>
                            <tr>
                                <th style={cellHeader}>Sr.</th>
                                <th style={{ ...cellHeader, textAlign: 'left' }}>Item Description</th>
                                <th style={cellHeader}>SAC Code</th>
                                <th style={cellHeader}>Qty</th>
                                <th style={cellHeader}>Unit</th>
                                <th style={cellHeader}>Unit Rate</th>
                                <th style={cellHeader}>Amount<br/>(Rs.)</th>
                                <th style={cellHeader}>CGST<br/>9%</th>
                                <th style={cellHeader}>SGST<br/>9%</th>
                                <th style={cellHeader}>Total<br/>Amt.</th>
                            </tr>
                        </thead>
                        <tbody>
                            {invoice.items && invoice.items.length > 0 ? (
                                <>
                                    {invoice.items.map((item: any, idx: number) => (
                                        <tr key={idx}>
                                            <td style={cellCenter}>{idx + 1}</td>
                                            <td style={{ ...cell, verticalAlign: 'top' }}>
                                                <div style={{ whiteSpace: 'pre-wrap' }}>{item.description}</div>
                                            </td>
                                            <td style={cellCenter}>{item.sac_code}</td>
                                            <td style={cellCenter}>{item.qty}</td>
                                            <td style={cellCenter}>{item.unit}</td>
                                            <td style={cellRight}>{fmt(item.unit_rate || item.rate)}</td>
                                            <td style={cellRight}>{fmt(item.amount)}</td>
                                            <td style={cellRight}>{fmt(item.cgst)}</td>
                                            <td style={cellRight}>{fmt(item.sgst)}</td>
                                            <td style={cellRight}>{fmt(item.total || item.total_amount)}</td>
                                        </tr>
                                    ))}
                                </>
                            ) : (
                                <tr>
                                    <td colSpan={10} style={{ ...cell, textAlign: 'center', color: '#9ca3af', fontStyle: 'italic', padding: 20 }}>
                                        No items listed
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                ) : (
                    /* ── PI: New format matching Invoice type 2 ── */
                    <table style={{ ...tbl }}>
                        <colgroup>
                            <col style={{ width: '6%' }} />
                            <col style={{ width: '16%' }} />
                            <col style={{ width: '10%' }} />
                            <col style={{ width: '14%' }} />
                            <col style={{ width: '16%' }} />
                            <col style={{ width: '12%' }} />
                            <col style={{ width: '12%' }} />
                            <col style={{ width: '14%' }} />
                        </colgroup>
                        <thead>
                            <tr>
                                <th style={cellHeader}>Sr.<br/>No.</th>
                                <th style={cellHeader}>Date</th>
                                <th style={cellHeader}>L/R<br/>No.</th>
                                <th style={cellHeader}>Manifest<br/>No</th>
                                <th style={cellHeader}>Vehicle No.</th>
                                <th style={cellHeader}>Quantity</th>
                                <th style={cellHeader}>Rate</th>
                                <th style={cellHeader}>Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            {invoice.items && invoice.items.length > 0 ? (
                                <>
                                    {(() => {
                                        let srNo = 0;
                                        return invoice.items.map((item: any, idx: number) => {
                                            srNo++;
                                            const transportSr = srNo;
                                            const detDays = parseFloat(item.detention_days) || 0;
                                            const detRate = parseFloat(item.detention_rate) || 0;
                                            const detAmount = parseFloat(item.detention_amount) || (detDays * detRate);
                                            const hasDetention = detDays > 0 && detRate > 0;
                                            if (hasDetention) srNo++;

                                            // Format inward/outward for detention row
                                            const itemDate = fmtDate(item.lr_date);
                                            const detBillingQty = detDays > 0 ? `${Math.ceil(detDays) + 1}-1=${Math.ceil(detDays)}` : '';

                                            return (
                                                <React.Fragment key={idx}>
                                                    {/* Transport Row */}
                                                    <tr>
                                                        <td style={cellCenter}>{transportSr}</td>
                                                        <td style={cellCenter}>{itemDate}</td>
                                                        <td style={cellCenter}>{item.lr_no || '-'}</td>
                                                        <td style={cellCenter}>{item.manifest_no || '-'}</td>
                                                        <td style={cellCenter}>{item.vehicle_no || '-'}</td>
                                                        <td style={{ ...cellCenter, whiteSpace: 'pre-wrap' }}>{item.qty_display || parseFloat(item.actual_qty || item.qty || 0).toFixed(2)}</td>
                                                        <td style={cellRight}>{fmt(item.rate || item.unit_rate)}</td>
                                                        <td style={cellRight}>{fmt(item.amount)}</td>
                                                    </tr>
                                                    {/* Detention Sub-Row */}
                                                    {hasDetention && (
                                                        <tr>
                                                            <td style={cellCenter}>{transportSr + 1}</td>
                                                            <td style={{ ...cellCenter, fontSize: '9px' }}>
                                                                {item.inward_date && item.outward_date
                                                                    ? `${fmtDate(item.inward_date)} To ${fmtDate(item.outward_date)}`
                                                                    : `Detention`}
                                                            </td>
                                                            <td style={cellCenter}>{item.lr_no || '-'}</td>
                                                            <td style={cellCenter}>{item.manifest_no || '-'}</td>
                                                            <td style={cellCenter}>{item.vehicle_no || '-'}</td>
                                                            <td style={cellCenter}>{detBillingQty}</td>
                                                            <td style={cellRight}>{fmt(detRate)}</td>
                                                            <td style={cellRight}>{fmt(detAmount)}</td>
                                                        </tr>
                                                    )}
                                                </React.Fragment>
                                            );
                                        });
                                    })()}
                                    {/* Total Row */}
                                    <tr style={{ fontWeight: 700 }}>
                                        <td colSpan={5} style={{ ...cell, textAlign: 'right' }}>Total</td>
                                        <td style={cellCenter}>
                                            {invoice.items.reduce((s: number, i: any) => s + (parseFloat(i.actual_qty ?? i.qty) || 0), 0).toFixed(2)}
                                        </td>
                                        <td style={cellCenter}></td>
                                        <td style={cellRight}>
                                            {fmt(invoice.items.reduce((s: number, i: any) => {
                                                const amt = parseFloat(i.amount) || 0;
                                                const detDays = parseFloat(i.detention_days) || 0;
                                                const detRate = parseFloat(i.detention_rate) || 0;
                                                const detAmt = parseFloat(i.detention_amount) || (detDays * detRate);
                                                return s + amt + (detDays > 0 ? detAmt : 0);
                                            }, 0))}
                                        </td>
                                    </tr>
                                </>
                            ) : (
                                <tr>
                                    <td colSpan={9} style={{ ...cell, textAlign: 'center', color: '#9ca3af', fontStyle: 'italic', padding: 20 }}>
                                        No items listed
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                )}

                {!isBEIL && (
                    <div style={{ fontSize: '9px', marginTop: 2 }}>*Minimum Quantity</div>
                )}

                <div style={{flex: 1}}></div> {/* Pushes next elements downward if space exists */}

                {/* Bank Details + Totals Table */}
                <table style={{ ...tbl }}>
                    <colgroup>
                        <col style={{ width: '16%' }} />    {/* label */}
                        <col style={{ width: '34%' }} />    {/* value */}
                        <col style={{ width: '20%' }} />    {/* tax label */}
                        <col style={{ width: '30%' }} />    {/* tax value */}
                    </colgroup>
                    <tbody>
                        <tr>
                            <td colSpan={2} style={{ ...cellBold, fontSize: '11px' }}>Bank Details</td>
                            <td style={cellBold}>TOTAL</td>
                            <td style={{ ...cellRight, fontWeight: 700 }}>
                                {fmt(invoice.amount || invoice.total_amount_before_tax)}
                            </td>
                        </tr>
                        <tr>
                            <td style={cellBold}>Name</td>
                            <td style={cell}>PURBIA ENTERPRISE</td>
                            <td style={cellBold}>SGST @ 9%</td>
                            <td style={cellRight}>{fmt(invoice.sgst_amount || (invoice.gst_amount / 2))}</td>
                        </tr>
                        <tr>
                            <td style={cellBold}>IFSC Code</td>
                            <td style={cell}>AUBL0002129</td>
                            <td style={cellBold}>CGST @ 9%</td>
                            <td style={cellRight}>{fmt(invoice.cgst_amount || (invoice.gst_amount / 2))}</td>
                        </tr>
                        <tr>
                            <td style={cellBold}>Account No.</td>
                            <td style={cell}>2121212937126385</td>
                            <td style={{ ...cellBold, fontSize: '11px' }}>Total Amount</td>
                            <td style={{ ...cellRight, fontWeight: 800, fontSize: '11px' }}>
                                ₹{fmt(invoice.total_amount)}
                            </td>
                        </tr>
                        <tr>
                            <td style={cellBold}>Bank &amp; Branch</td>
                            <td style={cell}>AU SMALL FINANCE BANK – Ankleshwar</td>
                            <td
                                colSpan={2}
                                rowSpan={3}
                                style={{ ...cell, verticalAlign: 'top', lineHeight: 1.5 }}
                            >
                                <strong>Total Rs. In Words:</strong>
                                <div style={{ marginTop: 4, fontStyle: 'italic' }}>
                                    {invoice.amount_in_words || '-'}
                                </div>
                            </td>
                        </tr>
                        <tr>
                            <td style={cellBold}>GSTIN</td>
                            <td style={cell}>24AJIPP3114D1ZO</td>
                        </tr>
                        <tr>
                            <td style={cellBold}>PAN</td>
                            <td style={cell}>AJIPP3114D</td>
                        </tr>
                        <tr>
                            <td style={cellBold}>HSN Code</td>
                            <td colSpan={3} style={cell}>{invoice.hsn_code || '-'}</td>
                        </tr>
                    </tbody>
                </table>

                {/* Authorised Signatory */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 30, marginBottom: 10 }}>
                    <div style={{ textAlign: 'center', minWidth: 180 }}>
                        <div style={{ fontSize: '10px', fontWeight: 700, marginBottom: 5 }}>
                            For, M/s PURBIA ENTERPRISE
                        </div>
                        <div style={{ height: 60, borderBottom: '1px solid black', marginBottom: 5 }} />
                        <div style={{ fontSize: '10px', fontWeight: 700 }}>Authorised Signatory</div>
                    </div>
                </div>

            </div>

            {/* FOOTER IMAGE */}
            <div style={{ width: '100%', flexShrink: 0, padding: 0 }}>
                {/* Changed to object-fit contain so it scales naturally without stretching */}
                <img
                    src="/footer-1.jpg"
                    alt="Footer"
                    style={{ width: '100%', height: 'auto', display: 'block', objectFit: 'contain' }}
                />
            </div>
        </div>
    );
};
