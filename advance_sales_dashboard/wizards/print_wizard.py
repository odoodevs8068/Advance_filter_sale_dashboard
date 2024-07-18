from odoo import models, fields, api, _
import time
from datetime import datetime, timedelta


class PrintReportWizard(models.TransientModel):
    _name = 'print.wizard'

    def _domain_sale_orders(self):
        domain = [('create_date', '>=', self.date_from), ('create_date', '<=', self.date_to)]
        return domain

    date_from = fields.Date(default=lambda *a: time.strftime('%Y-%m-%d'))
    date_to = fields.Date(default=lambda *a: time.strftime('%Y-%m-%d'))
    sale_order_id = fields.Many2one('sale.order', string="Sale Order")
    multi_sale_order = fields.Boolean('Multi SaleOrders')
    all_sales = fields.Boolean('All SaleOrders')
    sale_order_ids = fields.Many2many('sale.order', string="Sale Order")

    @api.onchange('date_from', 'date_to')
    def _onchange_date_range(self):
        if self.date_from and self.date_to:
            domain = [('create_date', '>=', self.date_from), ('create_date', '<=', self.date_to)]
            print(domain)
            return {
                'domain': {
                    'sale_order_id': domain,
                    'sale_order_ids': domain,
                }
            }

    def button_print_report(self):
        data = {'orders': []}
        sale_orders = None

        if self.multi_sale_order:
            sale_orders = self.sale_order_ids
        elif not self.multi_sale_order and not self.all_sales:
            sale_orders = self.sale_order_id
        elif self.all_sales:
            sale_orders = self.env['sale.order'].search([])

        for rec in sale_orders:
            sales_dict = {
                'sale_order_id': rec.name,
                'partner_id': rec.partner_id.name,
                'delivery_date': rec.commitment_date,
                'city': rec.partner_id.city,
                'region': rec.partner_id.city,
                'country_id': rec.partner_id.country_id.name,
                'order_line': []
            }

            for line in rec.order_line:
                order_line = {
                    'product_id': line.product_id.name,
                    'ordered_qty': line.product_uom_qty,
                    'qty_delivered': line.qty_delivered,
                    'balance_qty_deliver': line.product_uom_qty - line.qty_delivered,
                    'invoiced_qty': line.qty_invoiced,
                    'invoice_amount': line.price_subtotal,
                    'balance_amount_to_inv': line.price_subtotal - line.untaxed_amount_to_invoice,
                    'unit_price': line.price_unit,
                    'currency_id': line.currency_id.name,
                }
                sales_dict['order_line'].append(order_line)
            data['orders'].append(sales_dict)

        return self.env.ref('advance_sales_dashboard.report_sales_dynamic').report_action(self, data=data)


class SaleOrder(models.AbstractModel):
    _name = 'report.advance_sales_dashboard.sale_order_report'

    @api.model
    def _get_report_values(self, docids, data=None):
        if self.env.context.get('sale_order_report'):
            if data.get('report_data'):
                return data.get('report_data')
