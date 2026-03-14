import React from 'react';

interface InvoicePrintProps {
    invoice: any;
    businessType: 'BEIL' | 'PI';
    containerId?: string;
}

/**
 * A4 Invoice print component optimised for html2canvas PDF generation.
 * Layout: vertical flex column — header image sticks to top, footer image to bottom.
 * Body content has 8mm horizontal padding and balanced vertical spacing.
 */
export const InvoicePrint: React.FC<InvoicePrintProps> = ({
    invoice,
    businessType,
    containerId = 'invoice-print-container',
}) => {
    const isBEIL = businessType === 'BEIL';

    // ─── Formatters ─────────────────────────────────────────────────────────
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

    // ─── Common cell styles ─────────────────────────────────────────────────
    const cell: React.CSSProperties = {
        border: '1px solid black',
        padding: '4px 6px',
        fontSize: 8,
        verticalAlign: 'middle',
    };
    const cellSm: React.CSSProperties = { ...cell, fontSize: 7 };
    const cellBold: React.CSSProperties = { ...cell, fontWeight: 700 };
    const cellRight: React.CSSProperties = { ...cell, textAlign: 'right' };
    const cellCenter: React.CSSProperties = { ...cell, textAlign: 'center' };
    const cellHeader: React.CSSProperties = {
        ...cell,
        fontWeight: 700,
        backgroundColor: '#f3f4f6',
        textAlign: 'center',
        fontSize: 7,
    };

    const tbl: React.CSSProperties = {
        width: '100%',
        borderCollapse: 'collapse',
        tableLayout: 'fixed',
    };

    // ─── Container: A4 exact size, flex column ───────────────────────────────
    const containerStyle: React.CSSProperties = {
        width: '210mm',
        height: '297mm',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'Arial, Helvetica, sans-serif',
        backgroundColor: 'white',
        color: '#000',
        overflow: 'hidden',
    };

    // ─── Body section ────────────────────────────────────────────────────────
    const bodyStyle: React.CSSProperties = {
        flex: 1,
        padding: '6px 18px 6px 18px',
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        overflow: 'hidden',
    };

    // ─── Section spacer ──────────────────────────────────────────────────────
    const section = (marginTop = 0): React.CSSProperties => ({ marginTop });

    return (
        <div id={containerId} style={containerStyle}>

            {/* ══ HEADER IMAGE ══════════════════════════════════════════════ */}
            <div style={{ width: '100%', flexShrink: 0, lineHeight: 0 }}>
                <img
                    src="/header-1.jpg"
                    alt="Header"
                    style={{ width: '100%', display: 'block', maxHeight: 85, objectFit: 'cover', objectPosition: 'center' }}
                />
            </div>

            {/* ══ BODY CONTENT ══════════════════════════════════════════════ */}
            <div style={bodyStyle}>

                {/* Title */}
                <div style={{ textAlign: 'center', fontWeight: 800, fontSize: 11, textDecoration: 'underline', letterSpacing: 2, marginBottom: 2 }}>
                    TAX INVOICE
                </div>

                {/* ─── Header Info Table ─────────────────────────────────── */}
                <table style={tbl}>
                    <colgroup>
                        <col style={{ width: '30%' }} />
                        <col style={{ width: '20%' }} />
                        <col style={{ width: '22%' }} />
                        <col style={{ width: '28%' }} />
                    </colgroup>
                    <tbody>
                        <tr>
                            <td colSpan={2} style={{ ...cellBold, fontSize: 9 }}>
                                {isBEIL ? 'BEIL Infrastructure Ltd.' : 'PI Industries Ltd.'}
                            </td>
                            <td style={cellBold}>Invoice No.</td>
                            <td style={cell}>{invoice.invoice_no}</td>
                        </tr>
                        <tr>
                            <td colSpan={2} style={{ ...cellSm, verticalAlign: 'top', minHeight: 36 }}>
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
                            <td style={cellSm}>{invoice.billing_party_gstin || invoice.gst_number || '-'}</td>
                            <td style={cellBold}>PO No.</td>
                            <td style={cell}>{invoice.po_number || '-'}</td>
                        </tr>
                        <tr>
                            <td style={cellBold}>State Name</td>
                            <td style={cellSm}>{invoice.state || '-'}</td>
                            <td style={cellBold}>State Code</td>
                            <td style={cell}>{invoice.state_code || '-'}</td>
                        </tr>
                        <tr>
                            <td style={cellBold}>Payment Due Date</td>
                            <td style={cellSm}>{fmtDate(invoice.payment_due_date)}</td>
                            <td style={cellBold}>HSN Code</td>
                            <td style={cell}>{invoice.hsn_code || '-'}</td>
                        </tr>
                    </tbody>
                </table>

                {/* Subject */}
                {invoice.subject && (
                    <div style={{ fontSize: 7.5, margin: '2px 0' }}>
                        <strong>Subject: </strong>{invoice.subject}
                    </div>
                )}

                {/* ─── Items Table ───────────────────────────────────────── */}
                <table style={{ ...tbl, ...section() }}>
                    <thead>
                        <tr>
                            <th style={{ ...cellHeader, width: 26 }}>Sr.</th>
                            <th style={{ ...cellHeader, textAlign: 'left' }}>
                                {isBEIL ? 'Item Description' : 'Detail of Vehicles (Date / LR No. / Manifest / Vehicle)'}
                            </th>
                            {!isBEIL && (
                                <th style={{ ...cellHeader, textAlign: 'left', width: '18%' }}>Particulars of Service</th>
                            )}
                            <th style={{ ...cellHeader, width: 46 }}>SAC Code</th>
                            <th style={{ ...cellHeader, width: 30 }}>Qty</th>
                            <th style={{ ...cellHeader, width: 38 }}>Unit</th>
                            <th style={{ ...cellHeader, width: 48 }}>Unit Rate</th>
                            <th style={{ ...cellHeader, width: 56 }}>Amount (Rs.)</th>
                            <th style={{ ...cellHeader, width: 46 }}>CGST 9%</th>
                            <th style={{ ...cellHeader, width: 46 }}>SGST 9%</th>
                            <th style={{ ...cellHeader, width: 58 }}>Total Amt.</th>
                        </tr>
                    </thead>
                    <tbody>
                        {invoice.items && invoice.items.length > 0 ? (
                            <>
                                {invoice.items.map((item: any, idx: number) => (
                                    <tr key={idx}>
                                        <td style={{ ...cellCenter, fontSize: 7 }}>{idx + 1}</td>
                                        <td style={{ ...cellSm, verticalAlign: 'top' }}>
                                            {isBEIL ? (
                                                item.description
                                            ) : (
                                                <div style={{ lineHeight: 1.4 }}>
                                                    <strong>Date: </strong>{fmtDate(item.lr_date)}<br />
                                                    <strong>LR: </strong>{item.lr_no || '-'}<br />
                                                    <strong>Manif.: </strong>{item.manifest_no || '-'}<br />
                                                    <strong>Veh.: </strong>{item.vehicle_no || '-'}
                                                </div>
                                            )}
                                        </td>
                                        {!isBEIL && (
                                            <td style={{ ...cellSm, verticalAlign: 'top' }}>
                                                {item.description}
                                                {item.detention_days > 0 && (
                                                    <div style={{ marginTop: 2, fontWeight: 700, fontSize: 6.5 }}>
                                                        Detention: {item.detention_days} days @ ₹{item.detention_rate}/day
                                                    </div>
                                                )}
                                            </td>
                                        )}
                                        <td style={{ ...cellCenter, fontSize: 7 }}>{item.sac_code}</td>
                                        <td style={{ ...cellCenter, fontSize: 7 }}>
                                            {isBEIL ? item.qty : (item.qty_display ?? item.actual_qty ?? item.qty)}
                                        </td>
                                        <td style={{ ...cellCenter, fontSize: 7 }}>{item.unit}</td>
                                        <td style={{ ...cellRight, fontSize: 7 }}>{fmt(item.unit_rate || item.rate)}</td>
                                        <td style={{ ...cellRight, fontSize: 7 }}>{fmt(item.amount)}</td>
                                        <td style={{ ...cellRight, fontSize: 7 }}>{fmt(item.cgst)}</td>
                                        <td style={{ ...cellRight, fontSize: 7 }}>{fmt(item.sgst)}</td>
                                        <td style={{ ...cellRight, fontSize: 7 }}>{fmt(item.total || item.total_amount)}</td>
                                    </tr>
                                ))}

                                {/* PI Totals row */}
                                {!isBEIL && (
                                    <tr style={{ backgroundColor: '#f9fafb', fontWeight: 700 }}>
                                        <td colSpan={3} style={{ ...cell, textAlign: 'right', fontSize: 7 }}>TOTAL:</td>
                                        <td style={{ ...cellCenter, fontSize: 7 }}>—</td>
                                        <td style={{ ...cellCenter, fontSize: 7 }}>
                                            {invoice.items.reduce(
                                                (s: number, i: any) => s + (parseFloat(i.actual_qty ?? i.qty) || 0),
                                                0
                                            ).toFixed(2)}
                                        </td>
                                        <td style={{ ...cellCenter, fontSize: 7 }}>—</td>
                                        <td style={cellRight}>—</td>
                                        <td style={{ ...cellRight, fontSize: 7 }}>{fmt(invoice.amount)}</td>
                                        <td style={{ ...cellRight, fontSize: 7 }}>{fmt(invoice.cgst_amount || (invoice.gst_amount / 2))}</td>
                                        <td style={{ ...cellRight, fontSize: 7 }}>{fmt(invoice.sgst_amount || (invoice.gst_amount / 2))}</td>
                                        <td style={{ ...cellRight, fontSize: 7 }}>{fmt(invoice.total_amount)}</td>
                                    </tr>
                                )}
                            </>
                        ) : (
                            <tr>
                                <td
                                    colSpan={isBEIL ? 10 : 11}
                                    style={{ ...cell, textAlign: 'center', color: '#9ca3af', fontStyle: 'italic', padding: 12 }}
                                >
                                    No items listed
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>

                {!isBEIL && (
                    <div style={{ fontSize: 6.5, marginTop: 1 }}>*Minimum Quantity</div>
                )}

                {/* ─── Bank Details + Totals Table ───────────────────────── */}
                <table style={{ ...tbl, ...section(2) }}>
                    <colgroup>
                        <col style={{ width: '14%' }} />    {/* label */}
                        <col style={{ width: '36%' }} />    {/* value */}
                        <col style={{ width: '18%' }} />    {/* tax label */}
                        <col style={{ width: '32%' }} />    {/* tax value */}
                    </colgroup>
                    <tbody>
                        <tr>
                            <td colSpan={2} style={{ ...cellBold, fontSize: 8 }}>Bank Details</td>
                            <td style={cellBold}>TOTAL</td>
                            <td style={{ ...cellRight, fontWeight: 700 }}>
                                {fmt(invoice.amount || invoice.total_amount_before_tax)}
                            </td>
                        </tr>
                        <tr>
                            <td style={cellBold}>Name</td>
                            <td style={cellSm}>PURBIA ENTERPRISE</td>
                            <td style={cellBold}>SGST @ 9%</td>
                            <td style={cellRight}>{fmt(invoice.sgst_amount || (invoice.gst_amount / 2))}</td>
                        </tr>
                        <tr>
                            <td style={cellBold}>IFSC Code</td>
                            <td style={cellSm}>AUBL0002129</td>
                            <td style={cellBold}>CGST @ 9%</td>
                            <td style={cellRight}>{fmt(invoice.cgst_amount || (invoice.gst_amount / 2))}</td>
                        </tr>
                        <tr>
                            <td style={cellBold}>Account No.</td>
                            <td style={cellSm}>2121212937126385</td>
                            <td style={{ ...cellBold, fontSize: 8.5 }}>Total Amount</td>
                            <td style={{ ...cellRight, fontWeight: 800, fontSize: 8.5 }}>
                                ₹{fmt(invoice.total_amount)}
                            </td>
                        </tr>
                        <tr>
                            <td style={cellBold}>Bank & Branch</td>
                            <td style={cellSm}>AU SMALL FINANCE BANK – Ankleshwar</td>
                            <td
                                colSpan={2}
                                rowSpan={3}
                                style={{ ...cellSm, verticalAlign: 'top', lineHeight: 1.5 }}
                            >
                                <strong>Total Rs. In Words:</strong>
                                <div style={{ marginTop: 2, fontStyle: 'italic' }}>
                                    {invoice.amount_in_words || '-'}
                                </div>
                            </td>
                        </tr>
                        <tr>
                            <td style={cellBold}>GSTIN</td>
                            <td style={cellSm}>24AJIPP3114D1ZO</td>
                        </tr>
                        <tr>
                            <td style={cellBold}>PAN</td>
                            <td style={cellSm}>AJIPP3114D</td>
                        </tr>
                        <tr>
                            <td style={cellBold}>HSN Code</td>
                            <td colSpan={3} style={cellSm}>{invoice.hsn_code || '-'}</td>
                        </tr>
                    </tbody>
                </table>

                {/* ─── Authorised Signatory ──────────────────────────────── */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                    <div style={{ textAlign: 'center', minWidth: 140 }}>
                        <div style={{ fontSize: 7.5, fontWeight: 700, marginBottom: 2 }}>
                            For, M/s PURBIA ENTERPRISE
                        </div>
                        <div style={{ height: 38, borderBottom: '1px solid #bbb', marginBottom: 4 }} />
                        <div style={{ fontSize: 7.5, fontWeight: 700 }}>Authorised Signatory</div>
                    </div>
                </div>

            </div>
            {/* ══ END BODY ══════════════════════════════════════════════════ */}

            {/* ══ FOOTER IMAGE ══════════════════════════════════════════════ */}
            <div style={{ width: '100%', flexShrink: 0, lineHeight: 0 }}>
                <img
                    src="/footer-1.jpg"
                    alt="Footer"
                    style={{ width: '100%', display: 'block', maxHeight: 60, objectFit: 'cover', objectPosition: 'center' }}
                />
            </div>

            {/* ══ PRINT CSS (for browser Ctrl+P) ═══════════════════════════ */}
            <style>{`
                @media print {
                    @page { size: A4; margin: 0; }
                    html, body { margin: 0 !important; padding: 0 !important; }
                    #${containerId} { width: 210mm !important; height: 297mm !important; }
                    .no-print { display: none !important; }
                    * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                }
            `}</style>
        </div>
    );
};
