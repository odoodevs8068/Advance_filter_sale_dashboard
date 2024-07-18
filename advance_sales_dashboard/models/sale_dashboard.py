from odoo import api, fields, models, Command, _
import calendar
from datetime import datetime, timedelta
import io
import json
from collections import defaultdict
import random

try:
    from odoo.tools.misc import xlsxwriter
except ImportError:
    import xlsxwriter


class SaleCustomDashboard(models.Model):
    _name = "sale_custom.dashboard"

    @api.model
    def load_records(self):
        all_records = []

    @api.model
    def get_all_vals_dashboard(self):
        """ Send DATA to Dashboard to load Overall Values"""
        data = 'None'
        vals = {}
        vals.update(self.get_current_year())
        vals.update(self.get_sales_summary(data))
        vals.update(self.get_sales_status(data))
        vals.update(self.get_top_products_by_value_dt(data))
        vals.update(self.get_top_products_by_quantity_dt(data))
        vals.update(self.get_top_customers_by_value_dt(data))
        return vals

    @api.model
    def get_current_year(self):
        values = {
            "current_year": datetime.now().year
        }
        return values

    def get_sales_data(self, sale_order):
        sales_list = []
        for sales in sale_order:
            sales_dict = {
                'id': sales.id,
                'number': sales.name,
                'customer': sales.partner_id.name,
                'date_order': sales.date_order,
                'state': "Quotation" if sales.state == 'draft' else (
                    'Quotation Sent' if sales.state== 'sent' else (
                        'Sales Order' if sales.state == 'sale' else(
                            'Done' if sales.state == 'done' else(
                                'Cancelled' if sales.state == 'cancel' else None
                            )
                        )
                    )),
                'invoice_status': 'Upselling' if sales.invoice_status == 'upselling' else (
                    'Fully Invoice' if sales.invoice_status == 'invoiced' else (
                        'To Invoice' if sales.invoice_status == 'to invoice' else (
                            'Nothing to Invoice' if sales.invoice_status == 'no' else None
                        )
                    )
                ),
                'amount_total': sales.amount_total,
                'user_id': sales.user_id.name
            }
            sales_list.append(sales_dict)
        return sales_list

    @api.model
    def get_sales_summary(self, data):
        """Get Sales Orders Details and Sale order Status details to Load In Dashboard"""
        if "multi_filter" in self.env.context:
            domain = data
        else:
            domain = [('date_order', '>=', data['date_from']),
                      ('date_order', '<=', data['date_to'])] if data != 'None' else []

        sale_orders = self.env['sale.order'].search(domain, order='amount_total desc')
        total_products_sold = len(sale_orders.order_line.product_id.ids)
        total_sale_amount = sum(sale_orders.mapped('amount_total'))
        formatted_total_sale_amount = "$ {:.0f}K".format(total_sale_amount / 1000)
        total_revenue = total_sale_amount
        total_customers = len(sale_orders.partner_id.ids)
        total_cost = sum(
            line.product_id.standard_price * line.product_uom_qty for line in sale_orders.mapped('order_line'))
        gross_profit = total_revenue - total_cost
        gross_profit_or_loss = "Profit" if gross_profit >= 0 else "Loss"
        formatted_gross_profit = "$ {:.0f}K".format(gross_profit / 1000)

        sales_data = self.get_sales_data(sale_orders)
        o_sales_details = self.get_o_sales_status(sale_orders)

        sales_summary = {
            'total_sales': len(sale_orders),
            'total_customers': total_customers,
            'total_products_sold': total_products_sold,
            'formatted_total_sale_amount': formatted_total_sale_amount,
            'total_revenue': total_revenue,
            'gross_profit_or_loss': gross_profit_or_loss,
            'formatted_gross_profit': formatted_gross_profit,
            'sales_list': sales_data,
            'o_sales_details': o_sales_details,
        }
        return {
            'sales_details': sales_summary,
        }

    def get_o_sales_status(self, sale_orders):
        o_quotation_ids = sale_orders.filtered(lambda x: x.state == 'draft').ids
        o_sent_ids = sale_orders.filtered(lambda x: x.state == 'sent').ids
        o_sale_ids = sale_orders.filtered(lambda x: x.state in ('sale', 'done')).ids
        o_cancel_ids = sale_orders.filtered(lambda x: x.state == 'cancel').ids
        o_done_ids = sale_orders.filtered(lambda x: x.state == 'done').ids

        o_quotation_percent = round((len(o_quotation_ids) / len(sale_orders)) * 100) if len(sale_orders) > 0 else 0
        o_sent_percent = round((len(o_sent_ids) / len(sale_orders)) * 100) if len(sale_orders) > 0 else 0
        o_sale_percent = round((len(o_sale_ids) / len(sale_orders)) * 100) if len(sale_orders) > 0 else 0
        o_cancel_percent = round((len(o_cancel_ids) / len(sale_orders)) * 100) if len(sale_orders) > 0 else 0
        o_done_percent = round((len(o_done_ids) / len(sale_orders)) * 100) if len(sale_orders) > 0 else 0

        o_upselling = sale_orders.filtered(lambda x: x.invoice_status == 'upselling').ids
        o_invoiced = sale_orders.filtered(lambda x: x.invoice_status == 'invoiced').ids
        o_to_invoice = sale_orders.filtered(lambda x: x.invoice_status == 'to invoice').ids
        o_no = sale_orders.filtered(lambda x: x.invoice_status == 'no').ids

        o_upselling_percent = round((len(o_upselling) / len(sale_orders)) * 100) if len(sale_orders) > 0 else 0
        o_invoiced_percent = round((len(o_invoiced) / len(sale_orders)) * 100) if len(sale_orders) > 0 else 0
        o_to_invoice_percent = round((len(o_to_invoice) / len(sale_orders)) * 100) if len(sale_orders) > 0 else 0
        o_no_percent = round((len(o_no) / len(sale_orders)) * 100) if len(sale_orders) > 0 else 0

        return {
            # sales Status

            'o_quotation': len(o_quotation_ids),
            'o_sent': len(o_sent_ids),
            'o_sale': len(o_sale_ids),
            'o_cancel': len(o_cancel_ids),
            'o_done': len(o_done_ids),
            'o_quotation_percent': o_quotation_percent,
            'o_sent_percent': o_sent_percent,
            'o_sale_percent': o_sale_percent,
            'o_cancel_percent': o_cancel_percent,
            'o_done_percent': o_done_percent,

            # sales Invoice Status
            'o_upselling': len(o_upselling),
            'o_invoiced': len(o_invoiced),
            'o_to_invoice': len(o_to_invoice),
            'o_no': len(o_no),
            'o_upselling_percent': o_upselling_percent,
            'o_invoiced_percent': o_invoiced_percent,
            'o_to_invoice_percent': o_to_invoice_percent,
            'o_no_percent': o_no_percent,

            'quotation_ids': o_quotation_ids,
            'sent_ids': o_sent_ids,
            'sale_ids': o_sale_ids,
            'done_ids': o_done_ids,
            'cancel_ids': o_cancel_ids,
            'upselling_ids': o_upselling,
            'invoiced_ids': o_invoiced,
            'to_invoice_ids': o_to_invoice,
            'no_ids': o_no,
            'total_sales_ids': sale_orders.ids,
            'total_sales': len(sale_orders)
        }

    @api.model
    def get_sales_status(self, data):
        if "multi_filter" in self.env.context:
            domain = data
        else:
            domain = [('date_order', '>=', data['date_from']), ('date_order', '<=', data['date_to'])] if data != 'None' else []

        sale_orders = self.env['sale.order'].search(domain, order='amount_total desc')

        sales_status = self.get_o_sales_status(sale_orders)
        return {
            'sales_status': sales_status
        }

    @api.model
    def get_top_products_by_value_dt(self, data):
        if "multi_filter" in self.env.context:
            domain = data
        else:
            domain = [('date_order', '>=', data['date_from']), ('date_order', '<=', data['date_to'])] if data != 'None' else []

        domain += [('state', 'in', ['sale', 'done'])]
        sale_orders = self.env['sale.order'].search(domain, order='amount_total desc')
        sale_order_ids = sale_orders.ids

        if sale_order_ids:
            query = """
                        SELECT 
                            sol.product_id,
                            pt.name AS product_name,
                            SUM(sol.product_uom_qty) AS total_quantity,
                            SUM(sol.price_total) AS total_value
                        FROM 
                            sale_order_line AS sol
                        JOIN 
                            product_product AS pp ON sol.product_id = pp.id
                        JOIN 
                            product_template AS pt ON pp.product_tmpl_id = pt.id
                        WHERE 
                            sol.order_id IN %s
                        GROUP BY 
                            sol.product_id, pt.name
                        ORDER BY 
                            total_value DESC;
                            
                    """
            self.env.cr.execute(query, (tuple(sale_order_ids),))
            result = self.env.cr.fetchall()
            top_products_by_value = [
                {
                    'product_name': record[1],
                    'total_value': record[3],
                    'product_id': record[0]
                }
                for record in result
            ]

            return top_products_by_value if data != 'None' else {'top_products_by_value': top_products_by_value}

    @api.model
    def get_top_products_by_quantity_dt(self, data):
        if "multi_filter" in self.env.context:
            domain = data
        else:
            domain = [('date_order', '>=', data['date_from']),
                      ('date_order', '<=', data['date_to'])] if data != 'None' else []

        domain += [('state', 'in', ['sale', 'done'])]
        sale_orders = self.env['sale.order'].search(domain, order='amount_total desc')
        sale_order_ids = sale_orders.ids

        if sale_order_ids:
            query = """
                            SELECT 
                                sol.product_id,
                                pt.name AS product_name,
                                SUM(sol.product_uom_qty) AS total_quantity,
                                SUM(sol.price_total) AS total_value
                            FROM 
                                sale_order_line AS sol
                            JOIN 
                                product_product AS pp ON sol.product_id = pp.id
                            JOIN 
                                product_template AS pt ON pp.product_tmpl_id = pt.id
                            WHERE 
                                sol.order_id IN %s
                            GROUP BY 
                                sol.product_id, pt.name
                            ORDER BY 
                                total_quantity  DESC;

                        """
            self.env.cr.execute(query, (tuple(sale_order_ids),))
            result = self.env.cr.fetchall()
            top_products_by_quantity = [
                {
                    'product_name': record[1],
                    'total_quantity': record[2],
                    'product_id': record[0]
                }
                for record in result
            ]
            return top_products_by_quantity if data != 'None' else {'top_products_by_quantity': top_products_by_quantity}

    @api.model
    def get_top_customers_by_value_dt(self, data):
        def get_sale_orders(data):
            if "multi_filter" in self.env.context:
                domain = data
            else:
                domain = [('date_order', '>=', data['date_from']),
                      ('date_order', '<=', data['date_to'])] if data != 'None' else []

            domain += [('state', 'in', ['sale', 'done'])]
            return self.env['sale.order'].search(domain, order='amount_total desc')

        def aggregate_sales_by_customer(sale_orders):
            customer_sales = {}
            for order in sale_orders:
                customer = order.partner_id
                customer_sales[customer] = customer_sales.get(customer, 0) + order.amount_total
            return sorted(customer_sales.items(), key=lambda x: x[1], reverse=True)

        def get_top_customers(sorted_customers):
            return [
                {
                    'customer_name': cust.name,
                    'total_value': value,
                    'customer_id': cust.id,
                    'country_id': cust.country_id.id,
                    'country_name': cust.country_id.name,
                } for cust, value in sorted_customers
            ]

        def aggregate_sales_by_country(customers):
            country_sales = {}
            for customer in customers:
                country_name = customer['country_name']
                region_group = self.env['res.country.group'].search([('country_ids.name', '=', country_name)], limit=1)
                region_name = region_group.name if region_group else "Unknown"
                if country_name in country_sales:
                    country_sales[country_name]['total_value'] += customer['total_value']
                else:
                    country_sales[country_name] = {'total_value': customer['total_value'], 'region': region_name}
            return [
                {'country': country, 'total_value': value['total_value'], 'region': value['region']}
                for country, value in country_sales.items()
            ]

        def aggregate_sales_by_region(countries):
            region_sales = {}
            for country in countries:
                region_name = country['region']
                region_sales[region_name] = region_sales.get(region_name, 0) + country['total_value']
            return [{'region_name': region, 'total_value': value} for region, value in region_sales.items()]

        sale_orders = get_sale_orders(data)
        sorted_customers = aggregate_sales_by_customer(sale_orders)
        top_customers_by_value = get_top_customers(sorted_customers)
        top_countries_by_value = aggregate_sales_by_country(top_customers_by_value)
        top_regions_by_value = aggregate_sales_by_region(top_countries_by_value)

        return {
            'top_customers_by_value': top_customers_by_value,
            'top_countries_by_value': top_countries_by_value,
            'top_regions_by_value': top_regions_by_value,
        }

    @api.model
    def get_report_data(self, data):
        if 'multi_filter' in self.env.context:
            ctx = self.with_context(multi_filter=True)
        else:
            ctx = self.with_context(pdf_filter=True)

        get_sales_summary = ctx.get_sales_summary(data)
        get_top_products_by_value = ctx.get_top_products_by_value_dt(data)
        get_top_customers_by_value = ctx.get_top_customers_by_value_dt(data)
        get_top_products_by_quantity_dt = ctx.get_top_products_by_quantity_dt(data)
        sales_data = ctx.get_pdf_sales_details(data)

        report_data = {
            'total_sales': get_sales_summary['sales_details']['total_sales'],
            'total_products_sold': get_sales_summary['sales_details']['total_products_sold'],
            'total_customers': get_sales_summary['sales_details']['total_customers'],
            'formatted_total_sale_amount': get_sales_summary['sales_details']['formatted_total_sale_amount'],
            'top_products_by_value': get_top_products_by_value,
            'top_products_by_quantity': get_top_products_by_quantity_dt,
            'top_customers_by_value': get_top_customers_by_value['top_customers_by_value'],
            'top_countries_by_value': get_top_customers_by_value['top_countries_by_value'],
            'top_regions_by_value': get_top_customers_by_value['top_regions_by_value'],
            'sales_list': sales_data,
        }
        if 'multi_filter' not in self.env.context:
            report_data['date_from'] = data.get('date_from')
            report_data['date_to'] = data.get('date_to')

        return report_data

    @api.model
    def get_pdf_sales_details(self, data):
        if "multi_filter" in self.env.context:
            domain = data
        else:
            domain = [('date_order', '>=', data['date_from']),
                      ('date_order', '<=', data['date_to'])] if data != 'None' else []

        sale_orders = self.env['sale.order'].search(domain, order='amount_total desc')
        sales_list = []
        for rec in sale_orders:
            sales_dict = {
                'id': rec.id,
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
            sales_list.append(sales_dict)
        return sales_list

    def get_sale_xlsx_report(self, response, report_data):
        data = json.loads(report_data)
        output = io.BytesIO()

        workbook = xlsxwriter.Workbook(output, {'in_memory': True})
        worksheet = workbook.add_worksheet()

        header_format = workbook.add_format({'bold': True, 'font_size': 14, 'align': 'center', 'valign': 'vcenter'})
        title_format = workbook.add_format({'bold': True, 'font_size': 12, 'align': 'center', 'valign': 'vcenter'})
        normal_format = workbook.add_format({'font_size': 10})
        bold_format = workbook.add_format({'bold': True, 'font_size': 10})

        # Adjust column widths
        worksheet.set_column('A:A', 20)
        worksheet.set_column('B:B', 20)
        worksheet.set_column('C:C', 20)
        worksheet.set_column('D:D', 20)

        # the header
        worksheet.merge_range('A1:D1', 'Sales Report', header_format)
        if 'date_from' and 'date_to' in data:
            worksheet.merge_range('A2:D2', f"Date Range: {data['date_from']} to {data['date_to']}", title_format)

        # summary data
        worksheet.write('A4', 'Total Sales:', bold_format)
        worksheet.write('B4', data['total_sales'], normal_format)
        worksheet.write('A5', 'Total Products Sold:', bold_format)
        worksheet.write('B5', data['total_products_sold'], normal_format)
        worksheet.write('A6', 'Total Customers:', bold_format)
        worksheet.write('B6', data['total_customers'], normal_format)
        worksheet.write('A7', 'Total Sale Amount:', bold_format)
        worksheet.write('B7', data['formatted_total_sale_amount'], normal_format)

        row = 9

        # Sales Order Details
        worksheet.write(row, 0, 'Sales Order Details', title_format)
        row += 2
        for sales in data['sales_list']:
            worksheet.write(row, 0,
                            f"Sale Order: {sales['sale_order_id']} / Customer: {sales['partner_id']} - {sales['city']}, {sales['country_id']}",
                            bold_format)
            worksheet.write(row + 1, 0, f"Delivery Date: {sales['delivery_date']}", normal_format)
            row += 3

            # order line table headers
            worksheet.write(row, 0, 'Product', bold_format)
            worksheet.write(row, 1, 'Currency', bold_format)
            worksheet.write(row, 2, 'Unit Price', bold_format)
            worksheet.write(row, 3, 'Ordered Qty', bold_format)
            worksheet.write(row, 4, 'Qty Delivered', bold_format)
            worksheet.write(row, 5, 'Balance Qty Delivered', bold_format)
            worksheet.write(row, 6, 'Invoice Qty', bold_format)
            worksheet.write(row, 7, 'Invoice Amount', bold_format)
            worksheet.write(row, 8, 'Balance Amount to Invoice', bold_format)
            row += 1

            # order lines
            for line in sales['order_line']:
                worksheet.write(row, 0, line['product_id'], normal_format)
                worksheet.write(row, 1, line['currency_id'], normal_format)
                worksheet.write(row, 2, line['unit_price'], normal_format)
                worksheet.write(row, 3, line['ordered_qty'], normal_format)
                worksheet.write(row, 4, line['qty_delivered'], normal_format)
                worksheet.write(row, 5, line['balance_qty_deliver'], normal_format)
                worksheet.write(row, 6, line['invoiced_qty'], normal_format)
                worksheet.write(row, 7, line['invoice_amount'], normal_format)
                worksheet.write(row, 8, line['balance_amount_to_inv'], normal_format)
                row += 1

            row += 2

            # Top Products by Value
        worksheet.write(row, 0, 'Top Products by Value', title_format)
        row += 2
        worksheet.write(row, 0, 'Product', bold_format)
        worksheet.write(row, 1, 'Value', bold_format)
        row += 1

        for product in data['top_products_by_value']:
            worksheet.write(row, 0, product['product_name'], normal_format)
            worksheet.write(row, 1, product['total_value'], normal_format)
            row += 1

        row += 2

                # Products by Quantity
        worksheet.write(row, 0, 'Top Products by Quantity', title_format)
        row += 2
        worksheet.write(row, 0, 'Product', bold_format)
        worksheet.write(row, 1, 'Quantity', bold_format)
        row += 1

        for product in data['top_products_by_quantity']:
                worksheet.write(row, 0, product['product_name'], normal_format)
                worksheet.write(row, 1, product['total_quantity'], normal_format)
                row += 1

        row += 2

            # Top Customers by Value
        worksheet.write(row, 0, 'Top Customers by Value', title_format)
        row += 2
        worksheet.write(row, 0, 'Customer', bold_format)
        worksheet.write(row, 1, 'Value', bold_format)
        row += 1

        for customer in data['top_customers_by_value']:
                worksheet.write(row, 0, customer['customer_name'], normal_format)
                worksheet.write(row, 1, customer['total_value'], normal_format)
                row += 1

        row += 2

            # Top Regions by Value
        worksheet.write(row, 0, 'Top Regions by Value', title_format)
        row += 2
        worksheet.write(row, 0, 'Region', bold_format)
        worksheet.write(row, 1, 'Value', bold_format)
        row += 1

        for region in data['top_regions_by_value']:
            worksheet.write(row, 0, region['region_name'], normal_format)
            worksheet.write(row, 1, region['total_value'], normal_format)
            row += 1

        row += 2

            # Top Countries by Value
        worksheet.write(row, 0, 'Top Countries by Value', title_format)
        row += 2
        worksheet.write(row, 0, 'Country', bold_format)
        worksheet.write(row, 1, 'Value', bold_format)
        row += 1

        for country in data['top_countries_by_value']:
            worksheet.write(row, 0, country['country'], normal_format)
            worksheet.write(row, 1, country['total_value'], normal_format)
            row += 1

        workbook.close()
        output.seek(0)
        response.stream.write(output.read())
        output.close()

    def _generate_distinct_colors(self, num_colors):
        """Generate a list of distinct colors."""
        colors = []
        for i in range(num_colors):
            color = "#{:00x}".format(random.randint(0, 0xFFFFFF))
            colors.append(color)
        return colors

    def get_yearly_dates(self):
        start_date = f"{datetime.now().year}-01-01"
        end_date = f"{datetime.now().year}-12-31"

        domain = [('state', '!=', 'cancel'),
                  ('date_order', '>=', start_date),
                  ('date_order', '<=', end_date)]
        return domain

    @api.model
    def get_top_products_weekly_pie_chart_data(self):
        today = datetime.now()
        week_start = today - timedelta(days=today.weekday())
        week_start_str = week_start.strftime('%Y-%m-%d')

        week_end = week_start + timedelta(days=6)
        week_end_str = week_end.strftime('%Y-%m-%d')
        domain = [('state', '!=', 'cancel'),
            ('date_order', '>=', week_start_str),
            ('date_order', '<=', week_end_str)]

        top_products = self.with_context(multi_filter=False).get_top_products_by_value_dt(domain)

        labels = [product['product_name'] for product in top_products]
        values = [product['total_value'] for product in top_products]
        colors = self._generate_distinct_colors(len(top_products))

        pie_chart_data = {
                'labels': labels,
                'datasets': [{
                    'data': values,
                    'backgroundColor': colors,
                    'borderWidth': "2",

                }]
            }

        return pie_chart_data

    @api.model
    def get_yearly_sale_order_bar_chart_data(self):
        domain = self.get_yearly_dates()
        top_products = self.with_context(multi_filter=False).get_top_products_by_value_dt(domain)

        labels = [product['product_name'] for product in top_products]
        values = [product['total_value'] for product in top_products]
        colors = self._generate_distinct_colors(len(top_products))
        bar_chart_data = {
            'labels': labels,
            'datasets': [{
                'label': 'Values',
                'data': values,
                'backgroundColor': colors,
                'borderWidth': 2,
            }]
        }

        return bar_chart_data

    @api.model
    def get_yearly_products_by_qty_bar_chart_data(self):
        domain = self.get_yearly_dates()
        top_products = self.with_context(multi_filter=False).get_top_products_by_quantity_dt(domain)

        labels = [product['product_name'] for product in top_products]
        values = [product['total_quantity'] for product in top_products]
        colors = self._generate_distinct_colors(len(top_products))
        bar_chart_data = {
            'labels': labels,
            'datasets': [{
                'label': f"Quantity's",
                'data': values,
                'backgroundColor': colors,
                'borderWidth': 2,
            }]
        }

        return bar_chart_data

    @api.model
    def get_yearly_top_customers_by_value_radar_chart(self):
        domain = self.get_yearly_dates()
        top_customers = self.with_context(multi_filter=False).get_top_customers_by_value_dt(domain)

        labels = []
        values = []

        if 'radar_chart' in self.env.context:
            labels = [cust['customer_name'] for cust in top_customers['top_customers_by_value']]
            values = [cust['total_value'] for cust in top_customers['top_customers_by_value']]
        elif 'polar_chart' in self.env.context:
            labels = [cust['region_name'] for cust in top_customers['top_regions_by_value']]
            values = [cust['total_value'] for cust in top_customers['top_regions_by_value']]
        elif 'doughnut' in self.env.context:
            labels = [cust['country'] for cust in top_customers['top_countries_by_value']]
            values = [cust['total_value'] for cust in top_customers['top_countries_by_value']]

        colors = self._generate_distinct_colors(len(top_customers))
        chart_data = {
            'labels': labels,
            'datasets': [{
                'label': 'Values',
                'data': values,
                'backgroundColor': colors,
                'borderWidth': 2,
            }]
        }

        return chart_data

    @api.model
    def get_yearly_sale_order_horizontal_bar_chart_data(self):
        months = [calendar.month_name[x] for x in range(1, 13)]

        start_date = f"{datetime.now().year}-01-01"
        end_date = f"{datetime.now().year}-12-31"

        def get_sale_orders():
            return self.env['sale.order'].search([
                ('state', '!=', 'cancel'),
                ('date_order', '>=', start_date),
                ('date_order', '<=', end_date)
            ])

        data = {
            'labels': months,
            'datasets': [
                {
                    'label': "Amount",
                    'data': [
                        sum(order.amount_total for order in
                            get_sale_orders().filtered(lambda x: x.date_order.month == i))
                        for i in range(1, 13)
                    ],
                    'borderColor': "rgba(47, 151, 167)",
                    'borderWidth': 2,
                    'backgroundColor': "rgba(97, 204, 215)"
                }
            ]
        }

        return {"data": data}

    @api.model
    def get_yearly_sale_status_horizontal_bar_chart(self):
        start_date = f"{datetime.now().year}-01-01"
        end_date = f"{datetime.now().year}-12-31"

        sales_orders = self.env['sale.order'].search([
            ('date_order', '>=', start_date),
            ('date_order', '<=', end_date)
        ])

        sales_status_data = self.get_o_sales_status(sales_orders)

        data = {
            'labels': ["Sales Status"],
            'datasets': [
                {
                    'label': "Quotation",
                    'data': [sales_status_data['o_quotation']],
                    'backgroundColor': "rgba(255, 99, 132, 0.6)",
                    'borderColor': "rgba(255, 99, 132, 1)",
                    'borderWidth': 1
                },
                {
                    'label': "Sent",
                    'data': [sales_status_data['o_sent']],
                    'backgroundColor': "rgba(54, 162, 235, 0.6)",
                    'borderColor': "rgba(54, 162, 235, 1)",
                    'borderWidth': 1
                },
                {
                    'label': "Sale Order",
                    'data': [sales_status_data['o_sale']],
                    'backgroundColor': "rgba(75, 192, 192, 0.6)",
                    'borderColor': "rgba(75, 192, 192, 1)",
                    'borderWidth': 1
                },
                {
                    'label': "Done",
                    'data': [sales_status_data['o_done']],
                    'backgroundColor': "rgba(153, 102, 255, 0.6)",
                    'borderColor': "rgba(153, 102, 255, 1)",
                    'borderWidth': 1
                },
                {
                    'label': "Cancelled",
                    'data': [sales_status_data['o_cancel']],
                    'backgroundColor': "rgba(255, 159, 64, 0.6)",
                    'borderColor': "rgba(255, 159, 64, 1)",
                    'borderWidth': 1
                }
            ]
        }

        return {"data": data}


class SearchRecord(models.Model):
    _name = 'search.record'

    models = fields.Many2one('ir.model', string='Model', requires=True)
    name = fields.Char()
    model_name = fields.Char()