<?php

namespace App\Services;

use App\Models\Sale;
use Dompdf\Dompdf;
use Dompdf\Options;
use Illuminate\Support\Facades\Storage;

class ReceiptService
{
    /**
     * Generate PDF invoice for sale (used for sale confirmations)
     */
    public function generateReceipt(Sale $sale): string
    {
        return $this->generateDocument($sale, 'invoice');
    }

    /**
     * Generate PDF receipt for payment (used for payment confirmations)
     */
    public function generatePaymentReceipt(Sale $sale): string
    {
        return $this->generateDocument($sale, 'receipt');
    }

    /**
     * Generate PDF document (invoice or receipt)
     */
    private function generateDocument(Sale $sale, string $type = 'invoice'): string
    {
        // Refresh sale to ensure we have latest total_paid and balance
        $sale->refresh();
        $sale->recalculateTotalPaid();
        
        // Load relationships
        $sale->load(['order.user', 'items.product', 'payments']);

        // Set up DomPDF options
        $options = new Options();
        $options->set('isHtml5ParserEnabled', true);
        $options->set('isRemoteEnabled', true);
        $options->set('defaultFont', 'Arial');

        $dompdf = new Dompdf($options);

        // Generate HTML content based on type
        $html = $type === 'receipt' 
            ? $this->generateReceiptHtml($sale) 
            : $this->generateInvoiceHtml($sale);

        $dompdf->loadHtml($html);
        $dompdf->setPaper('A4', 'portrait');
        $dompdf->render();

        // Save PDF to storage (always regenerate to include latest balance and payments)
        $filename = "{$sale->sale_number}.pdf";
        $path = "receipts/{$filename}";

        Storage::disk('local')->put($path, $dompdf->output());

        // Update sale receipt_generated flag
        $sale->update(['receipt_generated' => true]);

        return $path;
    }

    /**
     * Generate HTML content for invoice (sale confirmation)
     */
    private function generateInvoiceHtml(Sale $sale): string
    {
        $companyName = config('app.name', 'EasyBuy');
        $companyAddress = config('app.address', '');
        $companyPhone = config('app.phone', '');
        $companyEmail = config('app.email', '');

        $customerName = $sale->customer_name ?? 'Customer';
        $customerEmail = $sale->customer_email ?? '';
        $customerPhone = $sale->customer_phone ?? '';

        $html = '
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                body {
                    font-family: Arial, sans-serif;
                    margin: 0;
                    padding: 20px;
                    color: #333;
                }
                .header {
                    text-align: center;
                    border-bottom: 2px solid #333;
                    padding-bottom: 20px;
                    margin-bottom: 30px;
                }
                .header h1 {
                    margin: 0;
                    color: #2c3e50;
                    font-size: 28px;
                }
                .header p {
                    margin: 5px 0;
                    color: #7f8c8d;
                }
                .receipt-info {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 30px;
                }
                .info-box {
                    flex: 1;
                }
                .info-box h3 {
                    margin: 0 0 10px 0;
                    color: #2c3e50;
                    font-size: 14px;
                    text-transform: uppercase;
                }
                .info-box p {
                    margin: 5px 0;
                    color: #555;
                }
                table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-bottom: 30px;
                }
                table th {
                    background-color: #34495e;
                    color: white;
                    padding: 12px;
                    text-align: left;
                    font-weight: bold;
                }
                table td {
                    padding: 10px 12px;
                    border-bottom: 1px solid #ddd;
                }
                table tr:hover {
                    background-color: #f5f5f5;
                }
                .totals {
                    text-align: right;
                    margin-top: 20px;
                }
                .totals table {
                    width: 300px;
                    margin-left: auto;
                }
                .totals td {
                    padding: 8px 12px;
                }
                .totals .total-row {
                    font-weight: bold;
                    font-size: 18px;
                    border-top: 2px solid #333;
                    border-bottom: 2px solid #333;
                }
                .payment-info {
                    margin-top: 30px;
                    padding-top: 20px;
                    border-top: 1px solid #ddd;
                }
                .payment-info h3 {
                    color: #2c3e50;
                    margin-bottom: 10px;
                }
                .footer {
                    margin-top: 40px;
                    padding-top: 20px;
                    border-top: 1px solid #ddd;
                    text-align: center;
                    color: #7f8c8d;
                    font-size: 12px;
                }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>INVOICE</h1>
                <h2>' . htmlspecialchars($companyName) . '</h2>
                <p>' . htmlspecialchars($companyAddress) . '</p>
                <p>Phone: ' . htmlspecialchars($companyPhone) . ' | Email: ' . htmlspecialchars($companyEmail) . '</p>
            </div>

            <div class="receipt-info">
                <div class="info-box">
                    <h3>Invoice Information</h3>
                    <p><strong>Invoice Number:</strong> ' . htmlspecialchars($sale->sale_number) . '</p>
                    <p><strong>Date:</strong> ' . $sale->made_on->format('F d, Y h:i A') . '</p>
                    <p><strong>Payment Status:</strong> ' . ucfirst(str_replace('-', ' ', $sale->payment_status)) . '</p>
                </div>
                <div class="info-box">
                    <h3>Customer Information</h3>
                    <p><strong>Name:</strong> ' . htmlspecialchars($customerName) . '</p>
                    ' . ($customerEmail ? '<p><strong>Email:</strong> ' . htmlspecialchars($customerEmail) . '</p>' : '') . '
                    ' . ($customerPhone ? '<p><strong>Phone:</strong> ' . htmlspecialchars($customerPhone) . '</p>' : '') . '
                </div>
            </div>

            <table>
                <thead>
                    <tr>
                        <th>Product</th>
                        <th>Quantity</th>
                        <th>Unit Price</th>
                        <th>Subtotal</th>
                    </tr>
                </thead>
                <tbody>';

        foreach ($sale->items as $item) {
            $quantity = $item->kilogram ? number_format($item->kilogram, 3) . ' kg' : $item->quantity;
            $html .= '
                    <tr>
                        <td>' . htmlspecialchars($item->product->name) . '</td>
                        <td>' . $quantity . '</td>
                        <td>KES ' . number_format($item->unit_price, 2) . '</td>
                        <td>KES ' . number_format($item->subtotal, 2) . '</td>
                    </tr>';
        }

        $html .= '
                </tbody>
            </table>

            <div class="totals">
                <table>
                    <tr>
                        <td><strong>Total Amount:</strong></td>
                        <td><strong>KES ' . number_format($sale->total_amount, 2) . '</strong></td>
                    </tr>
                    <tr>
                        <td>Total Paid:</td>
                        <td>KES ' . number_format($sale->total_paid, 2) . '</td>
                    </tr>
                    <tr class="total-row">
                        <td><strong>Balance:</strong></td>
                        <td><strong>KES ' . number_format($sale->balance, 2) . '</strong></td>
                    </tr>
                </table>
            </div>';

        if ($sale->payments->count() > 0) {
            $html .= '
            <div class="payment-info">
                <h3>Payment Details</h3>
                <table>
                    <thead>
                        <tr>
                            <th>Payment Number</th>
                            <th>Method</th>
                            <th>Amount</th>
                            <th>Date</th>
                        </tr>
                    </thead>
                    <tbody>';

            foreach ($sale->payments->where('status', 'completed') as $payment) {
                $html .= '
                        <tr>
                            <td>' . htmlspecialchars($payment->payment_number) . '</td>
                            <td>' . ucfirst($payment->payment_method) . '</td>
                            <td>KES ' . number_format($payment->amount, 2) . '</td>
                            <td>' . $payment->paid_at->format('M d, Y h:i A') . '</td>
                        </tr>';
            }

            $html .= '
                    </tbody>
                </table>
            </div>';
        }

        $html .= '
            <div class="footer">
                <p>Thank you for your business!</p>
                <p>This is a computer-generated invoice.</p>
            </div>
        </body>
        </html>';

        return $html;
    }

    /**
     * Generate HTML content for receipt (payment confirmation)
     */
    private function generateReceiptHtml(Sale $sale): string
    {
        $companyName = config('app.name', 'EasyBuy');
        $companyAddress = config('app.address', '');
        $companyPhone = config('app.phone', '');
        $companyEmail = config('app.email', '');

        $customerName = $sale->customer_name ?? 'Customer';
        $customerEmail = $sale->customer_email ?? '';
        $customerPhone = $sale->customer_phone ?? '';

        $html = '
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                body {
                    font-family: Arial, sans-serif;
                    margin: 0;
                    padding: 20px;
                    color: #333;
                }
                .header {
                    text-align: center;
                    border-bottom: 2px solid #333;
                    padding-bottom: 20px;
                    margin-bottom: 30px;
                }
                .header h1 {
                    margin: 0;
                    color: #2c3e50;
                    font-size: 28px;
                }
                .header p {
                    margin: 5px 0;
                    color: #7f8c8d;
                }
                .receipt-info {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 30px;
                }
                .info-box {
                    flex: 1;
                }
                .info-box h3 {
                    margin: 0 0 10px 0;
                    color: #2c3e50;
                    font-size: 14px;
                    text-transform: uppercase;
                }
                .info-box p {
                    margin: 5px 0;
                    color: #555;
                }
                table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-bottom: 30px;
                }
                table th {
                    background-color: #34495e;
                    color: white;
                    padding: 12px;
                    text-align: left;
                    font-weight: bold;
                }
                table td {
                    padding: 10px 12px;
                    border-bottom: 1px solid #ddd;
                }
                table tr:hover {
                    background-color: #f5f5f5;
                }
                .totals {
                    text-align: right;
                    margin-top: 20px;
                }
                .totals table {
                    width: 300px;
                    margin-left: auto;
                }
                .totals td {
                    padding: 8px 12px;
                }
                .totals .total-row {
                    font-weight: bold;
                    font-size: 18px;
                    border-top: 2px solid #333;
                    border-bottom: 2px solid #333;
                }
                .payment-info {
                    margin-top: 30px;
                    padding-top: 20px;
                    border-top: 1px solid #ddd;
                }
                .payment-info h3 {
                    color: #2c3e50;
                    margin-bottom: 10px;
                }
                .footer {
                    margin-top: 40px;
                    padding-top: 20px;
                    border-top: 1px solid #ddd;
                    text-align: center;
                    color: #7f8c8d;
                    font-size: 12px;
                }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>RECEIPT</h1>
                <h2>' . htmlspecialchars($companyName) . '</h2>
                <p>' . htmlspecialchars($companyAddress) . '</p>
                <p>Phone: ' . htmlspecialchars($companyPhone) . ' | Email: ' . htmlspecialchars($companyEmail) . '</p>
            </div>

            <div class="receipt-info">
                <div class="info-box">
                    <h3>Receipt Information</h3>
                    <p><strong>Receipt Number:</strong> ' . htmlspecialchars($sale->sale_number) . '</p>
                    <p><strong>Date:</strong> ' . $sale->made_on->format('F d, Y h:i A') . '</p>
                    <p><strong>Payment Status:</strong> ' . ucfirst(str_replace('-', ' ', $sale->payment_status)) . '</p>
                </div>
                <div class="info-box">
                    <h3>Customer Information</h3>
                    <p><strong>Name:</strong> ' . htmlspecialchars($customerName) . '</p>
                    ' . ($customerEmail ? '<p><strong>Email:</strong> ' . htmlspecialchars($customerEmail) . '</p>' : '') . '
                    ' . ($customerPhone ? '<p><strong>Phone:</strong> ' . htmlspecialchars($customerPhone) . '</p>' : '') . '
                </div>
            </div>

            <table>
                <thead>
                    <tr>
                        <th>Product</th>
                        <th>Quantity</th>
                        <th>Unit Price</th>
                        <th>Subtotal</th>
                    </tr>
                </thead>
                <tbody>';

        foreach ($sale->items as $item) {
            $quantity = $item->kilogram ? number_format($item->kilogram, 3) . ' kg' : $item->quantity;
            $html .= '
                    <tr>
                        <td>' . htmlspecialchars($item->product->name) . '</td>
                        <td>' . $quantity . '</td>
                        <td>KES ' . number_format($item->unit_price, 2) . '</td>
                        <td>KES ' . number_format($item->subtotal, 2) . '</td>
                    </tr>';
        }

        $html .= '
                </tbody>
            </table>

            <div class="totals">
                <table>
                    <tr>
                        <td><strong>Total Amount:</strong></td>
                        <td><strong>KES ' . number_format($sale->total_amount, 2) . '</strong></td>
                    </tr>
                    <tr>
                        <td>Total Paid:</td>
                        <td>KES ' . number_format($sale->total_paid, 2) . '</td>
                    </tr>
                    <tr class="total-row">
                        <td><strong>Balance:</strong></td>
                        <td><strong>KES ' . number_format($sale->balance, 2) . '</strong></td>
                    </tr>
                </table>
            </div>';

        if ($sale->payments->count() > 0) {
            $html .= '
            <div class="payment-info">
                <h3>Payment Details</h3>
                <table>
                    <thead>
                        <tr>
                            <th>Payment Number</th>
                            <th>Method</th>
                            <th>Amount</th>
                            <th>Date</th>
                        </tr>
                    </thead>
                    <tbody>';

            foreach ($sale->payments->where('status', 'completed') as $payment) {
                $html .= '
                        <tr>
                            <td>' . htmlspecialchars($payment->payment_number) . '</td>
                            <td>' . ucfirst($payment->payment_method) . '</td>
                            <td>KES ' . number_format($payment->amount, 2) . '</td>
                            <td>' . $payment->paid_at->format('M d, Y h:i A') . '</td>
                        </tr>';
            }

            $html .= '
                    </tbody>
                </table>
            </div>';
        }

        $html .= '
            <div class="footer">
                <p>Thank you for your business!</p>
                <p>This is a computer-generated receipt.</p>
            </div>
        </body>
        </html>';

        return $html;
    }
}

