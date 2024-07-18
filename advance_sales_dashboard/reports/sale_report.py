import xlsxwriter
from odoo import api, models, _
from datetime import datetime, date


class PartnerXlsx(models.AbstractModel):
    _name = 'report.advance_sales_dashboard.report_sales_dynamic_order_view'
    _inherit = 'report.report_xlsx.abstract'

    def generate_xlsx_report(self, workbook, data, partners):
        worksheet = workbook.add_worksheet("Sales Report")
        bold = workbook.add_format({'bold': True})

        row = 0

        for order in data['orders']:
            worksheet.write(row, 0, "SaleOrder Number:", bold)
            worksheet.write(row, 1, order['sale_order_id'])
            worksheet.write(row, 2, "Delivery Date:", bold)
            delivery_date = order['delivery_date']
            if delivery_date:
                worksheet.write(row, 3, delivery_date)
            row += 2

            # Customer Information
            worksheet.write(row, 0, "Customer", bold)
            worksheet.write(row, 1, "City", bold)
            worksheet.write(row, 2, "Region", bold)
            worksheet.write(row, 3, "Country", bold)
            row += 1

            worksheet.write(row, 0, order['partner_id'])
            worksheet.write(row, 1, order['city'])
            worksheet.write(row, 2, order['region'])
            worksheet.write(row, 3, order['country_id'])
            row += 2

            # Order Line Header
            worksheet.write(row, 0, "Order Line For", bold)
            worksheet.write(row, 1, f"{order['partner_id']} / {order['sale_order_id']}", bold)
            row += 1

            # Order Line Columns
            headers = ['Product', 'Ordered Qty', 'Delivered Qty', 'Balance Qty to Deliver', 'Invoiced Qty',
                       'Invoice Amount', 'Balance Amount to Invoice']
            for col, header in enumerate(headers):
                worksheet.write(row, col, header, bold)
            row += 1

            # Order Line Data
            for line in order['order_line']:
                worksheet.write(row, 0, line['product_id'])
                worksheet.write(row, 1, line['ordered_qty'])
                worksheet.write(row, 2, line['qty_delivered'])
                worksheet.write(row, 3, line['balance_qty_deliver'])
                worksheet.write(row, 4, line['invoiced_qty'])
                worksheet.write(row, 5, line['invoice_amount'])
                worksheet.write(row, 6, line['balance_amount_to_inv'])
                row += 1

            row += 2
