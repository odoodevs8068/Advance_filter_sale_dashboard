odoo.define('advance_sales_dashboard.sale_dashboard', function (require) {
'use strict';

    var AbstractAction = require('web.AbstractAction');
    var ajax = require('web.ajax');
    var core = require('web.core');
    var rpc = require('web.rpc');
    var web_client = require('web.web_client');
    var session = require('web.session');
    var _t = core._t;
    var QWeb = core.qweb;
    var datepicker = require('web.datepicker');
	var time = require('web.time');
    var framework = require('web.framework');
    var self = this;
    var pdf_filter = [];
    var pdf_multi_filter = false;

    var DashBoard = AbstractAction.extend({
        contentTemplate: 'Sales_Dashboards',
        events: {
            'click .reload_dashboard': 'reload_dashboard',
            'click .open_print_pdf_wizard': '_OpenWizard',
            'click .open_recent_search': '_OpenRecentSearch',
            'click .log_out': '_LogOutMenu',
            'click .container_menu_tog': '_ToogleClick',
            'click #view_sales': '_OpenFormViewSales',
            'click #view_product': '_OpenFormViewProduct',
            'click #view_customer': '_OpenFormViewCustomer',
            'click #create_sale_order': '_CreateSaleOrder',
            'click #view_sales_status_records': '_OpenSaleStatus',
            'click #apply_filter': '_OverallDateRangeApplyFilters',
            'click #add_filter': '_OpenFilterDropDown',
            'click #o_filter_apply': '_ActionFilterApply',
            'click #o_filter_cancel': '_ActionFilterCancel',
            'change #o_filter_field': '_onFilterFieldChange',
            'change #date_field_operators': '_onFilterFieldOperators',
            'click .print_pdf': '_PrintPdfReport',
            'click .print_xlsx': '_PrintXlsxReport',

//            Search Records Method
            'click .input-search': '_onClickInput',
            'click .search_view': '_OnClickSearch',
            'click .search_tag':'_SelectDropDownClick',
            'click #close_button':'_Close_button',

//          Filter Methods
            'mousedown div.input-group.date[data-target-input="nearest"]': '_onCalendarIconClick',
        },

        init: function(parent, context) {
            this._super(parent, context);
        },

        willStart: function(){
            var self = this;
            return this._super()
            .then(function() {
                var get_Dashboard_Values= self._rpc({
                    model: "sale_custom.dashboard",
                    method: "get_all_vals_dashboard",
                }).then(function (res) {
                    self.sales_details = res['sales_details'];
                    self.get_sales_status = res['sales_status'];
                    self.top_products_by_value = res['top_products_by_value'];
                    self.top_products_by_quantity = res['top_products_by_quantity'];
                    self.top_customers_by_value = res['top_customers_by_value'];
                    self.top_countries_by_value = res['top_countries_by_value'];
                    self.top_regions_by_value = res['top_regions_by_value'];
                    self.current_year = res['current_year'];
                });
                return $.when(get_Dashboard_Values);
            });
        },

        start: function() {
            var self = this;
            this.set("title", 'Advance Filter Sales Dashboard');
            return this._super().then(function() {
                self.render_sale_order_charts();
            });
        },

        render_sale_order_charts: function(){
            var self = this;
            self.render_top_products_yearly_line_chart();
            self.render_top_products_month_bar_chart();
            self.render_top_products_yearly_radar_chart();
            self.render_top_products_polar_area_chart();
            self.render_top_products_by_value_week_pie_chart();
            self.render_top_products_doughnut_chart();
            self.render_sale_month_bar_chart();
            self.render_salestatus_yearly_horizontal_bar_chart();
        },

        render_top_products_yearly_line_chart: function() {
            var self = this;
            self._rpc({
                model: "sale_custom.dashboard",
                method: "get_yearly_products_by_qty_bar_chart_data",
            })
            .then(function (res) {
                var ctx = self.$("#yearlytopproudctsAreaChart");
                var myChart = new Chart(ctx, {
                    type: 'line',
                    data: res,
                    options: {
                        responsive: true,
                        animations: {
                              tension: {
                                duration: 1000,
                                easing: 'linear',
                                from: 1,
                                to: 0,
                                loop: true
                              }
                            },
                         scales: {
                                y: {
                                    beginAtZero: true
                                }
                            },
                        elements: {
                            line: {
                                tension: 0.4
                            },
                            point: {
                                radius: 3
                            }
                        },
                        plugins: {
                            filler: {
                                propagate: true
                            },
                            legend: {
                                display: true
                            },
                            tooltip: {
                                enabled: true
                            }
                        }
                    },
                    datasets: [{
                        fill: true
                    }]
                });
            });
        },

        render_top_products_month_bar_chart: function(){
            var self = this;
            self._rpc({
                model: "sale_custom.dashboard",
                method: "get_yearly_sale_order_bar_chart_data",
            })
            .then(function (res) {
                var ctx = self.$("#TopproductsyearlybarChart");
                var myChart = new Chart(ctx, {
                    type: 'bar',
                    data: res,
                    options: {
                        scales: {
                            y: {
                                ticks: {
                                    beginAtZero: true,
                                    callback: function (value, index, values) {
                                        return '$' + value;
                                    }
                                },
                                stacked: true,
                            },
                        }
                    }
                });
            });
        },

        render_top_products_yearly_radar_chart: function() {
            var self = this;
            self._rpc({
                model: "sale_custom.dashboard",
                method: "get_yearly_top_customers_by_value_radar_chart",
                context: { radar_chart: true },
            })
            .then(function(res) {
                var ctx = self.$("#yearlytopproductsRadarChart");
                var myChart = new Chart(ctx, {
                    type: 'radar',
                    data: res,
                    options: {
                        responsive: true,
                        scales: {
                            r: {
                                angleLines: {
                                    display: true
                                },
                                suggestedMin: 0,
                                suggestedMax: 100
                            }
                        }
                    }
                });
            });
        },

        render_top_products_polar_area_chart: function(){
            var self = this;
            self._rpc({
                model: "sale_custom.dashboard",
                method: "get_yearly_top_customers_by_value_radar_chart",
                context: { polar_chart: true },
            })
            .then(function (res) {
                var ctx = self.$("#TopproductsyearlyPolarChart");

                var myChart = new Chart(ctx, {
                    type: 'polarArea',
                    data: res,
                    options: {
                              responsive: true,
                              maintainAspectRatio: true,
                              title: {
                               display: true,
                                    text: 'Polar Area Chart'
                                },
                               animation: {
                                    animateRotate: true,
                                    animateScale: true
                                }
                             }
                    });
            });

        },

        render_top_products_by_value_week_pie_chart: function(){
            var self = this;
            self._rpc({
                model: "sale_custom.dashboard",
                method: "get_top_products_weekly_pie_chart_data",
            })
            .then(function (res) {
                var ctx = self.$("#topproductsweeklypiechart");
                var myChart = new Chart(ctx, {
                    type: 'pie',
                    data: res,
                    options: {
                        responsive: true,
                    }
                });
            });
        },

        render_top_products_doughnut_chart: function(){
            var self = this;
            self._rpc({
                model: "sale_custom.dashboard",
                method: "get_yearly_top_customers_by_value_radar_chart",
                context: { doughnut: true },
            })
            .then(function (res) {
                var ctx = self.$("#TopproductsyearlydoughnutChart");

                var myChart = new Chart(ctx, {
                    type: 'doughnut',
                    data: res,
                    options: {
                        responsive: true,
                        }
                    });
            });
        },

        render_sale_month_bar_chart: function () {
            var self = this;
            self._rpc({
                model: "sale_custom.dashboard",
                method: "get_yearly_sale_order_horizontal_bar_chart_data",
            })
            .then(function (res) {
                var ctx = self.$("#saleyearlybarChart");
                var myChart = new Chart(ctx, {
                    type: 'bar',
                    data: res['data'],
                    options: {
                        indexAxis: 'y',
                        scales: {
                            x: {
                                ticks: {
                                    beginAtZero: true,
                                    callback: function (value, index, values) {
                                        return '$' + value;
                                    }
                                },
                                stacked: true,
                            },
                            y: {
                                stacked: true,
                            }
                        }
                    }
                });
            });
        },

        render_salestatus_yearly_horizontal_bar_chart: function () {
            var self = this;
            self._rpc({
                model: "sale_custom.dashboard",
                method: "get_yearly_sale_status_horizontal_bar_chart",
            })
            .then(function (res) {
                var ctx = self.$("#salestatusyearlybarChart");
                var myChart = new Chart(ctx, {
                    type: 'bar',
                    data: res.data,
                    options: {
                        indexAxis: 'y',
                        scales: {
                            x: {
                                ticks: {
                                    beginAtZero: true,
                                    callback: function (value) {
                                        return value;
                                    }
                                }
                            },
                            y: {
                                beginAtZero: true
                            }
                        }
                    }
                });
            });
        },

	   _onCalendarIconClick: function(ev) {
			var $calendarInputGroup = $(ev.currentTarget);
			var calendarOptions = {
				minDate: moment({
					y: 1000
				}),
				maxDate: moment().add(200, 'y'),
				calendarWeeks: true,
				defaultDate: moment().format(),
				sideBySide: true,
				buttons: {
					showClear: true,
					showClose: true,
					showToday: true,
				},

				icons: {
					date: 'fa fa-calendar',

				},
				locale: moment.locale(),
				format: time.getLangDateFormat(),
				widgetParent: 'body',
				allowInputToggle: true,
			};

			$calendarInputGroup.datetimepicker(calendarOptions);
		},

       render_dashboards: function() {
            var self = this;
            self.$('.Dashboard_main').append(QWeb.render("Sales_Dashboards", {widget: self}));
       },

       reload_dashboard: function(){
            location.reload();
       },

       _OpenFormViewSales: function(ev) {
            var orderNumber = $(ev.currentTarget).data('order-number');
            this.do_action({
                type: 'ir.actions.act_window',
                res_model: 'sale.order',
                res_id: orderNumber,
                views: [[false, 'form']],
                target: 'current',
            });
       },

        _CreateSaleOrder: function(ev) {
            this.do_action({
                type: 'ir.actions.act_window',
                res_model: 'sale.order',
//                res_id: [],
                views: [[false, 'form']],
                target: 'current',
            });
        },

        _OpenFormViewProduct: function(ev) {
            var product_id = $(ev.currentTarget).data('id');
            this.do_action({
                type: 'ir.actions.act_window',
                res_model: 'product.product',
                res_id: product_id,
                views: [[false, 'form']],
                target: 'current',
            });
        },

        _OpenFormViewCustomer: function(ev) {
            var customer_id = $(ev.currentTarget).data('id');
            this.do_action({
                type: 'ir.actions.act_window',
                res_model: 'res.partner',
                res_id: customer_id,
                views: [[false, 'form']],
                target: 'current',
            });
        },

        _OpenSaleStatus: function(ev) {
            var domain = [];
            var status_ids_str = $(ev.currentTarget).data('ids');
            console.log('status_ids_str', status_ids_str)
            status_ids_str = String(status_ids_str);
            var status_ids_array = [];
            if (status_ids_str.includes(',')) {
                status_ids_array = status_ids_str.split(',').map(Number);
            } else {
                status_ids_array = [Number(status_ids_str)];
            }
            console.log('status_ids_array', status_ids_array)

            this.do_action({
                type: 'ir.actions.act_window',
                name: "Sale Orders",
                res_model: 'sale.order',
                domain: [['id', 'in', status_ids_array]],
                views: [[false, 'list']],
                target: 'current',
            });
        },

        _OpenFilterDropDown : function(ev){
            document.getElementById('open_dropdown').style.display='block' ;
        },

        _ActionFilterCancel : function(ev){
            document.getElementById('open_dropdown').style.display='none';
        },

        _onFilterFieldOperators: function(ev){
            var selectedValue = $(ev.currentTarget).val();
            if (selectedValue === 'between'){
                document.getElementById('o_input_date_to').style.display = 'block';
            } else {
                document.getElementById('o_input_date_to').style.display = 'none';
            }
        },

       _onFilterFieldChange: function(ev) {
            var selectedValue = $(ev.currentTarget).val();

            var date_fields = [
                'create_date', 'commitment_date', 'effective_date', 'validity_date',
                'write_date', 'date_order', 'signed_on', 'my_activity_date_deadline',
                'activity_date_deadline'
            ];

            var set_fields = [
                'activity_exception_decoration', 'activity_state', 'invoice_status',
                'picking_policy', 'state', 'terms_type'
            ];

            var values_operator = [
                'currency_rate', 'amount_tax', 'amount_total', 'amount_untaxed'
            ];

            if (date_fields.includes(selectedValue)) {
                document.getElementById('o_filter_operator').style.display = 'none';
                document.getElementById('date_field_operators').style.display = 'block';
                document.getElementById('set_not_set_operator').style.display = 'none';
                document.getElementById('values_operator').style.display = 'none';
                document.getElementById('id_operator').style.display = 'none';
            } else if (set_fields.includes(selectedValue)) {
                document.getElementById('o_filter_operator').style.display = 'none';
                document.getElementById('date_field_operators').style.display = 'none';
                document.getElementById('set_not_set_operator').style.display = 'block';
                document.getElementById('values_operator').style.display = 'none';
                document.getElementById('id_operator').style.display = 'none';
            } else if (values_operator.includes(selectedValue)) {
                document.getElementById('o_filter_operator').style.display = 'none';
                document.getElementById('date_field_operators').style.display = 'none';
                document.getElementById('set_not_set_operator').style.display = 'none';
                document.getElementById('values_operator').style.display = 'block';
                document.getElementById('id_operator').style.display = 'none';
            } else if(selectedValue === 'id'){
                document.getElementById('o_filter_operator').style.display = 'none';
                document.getElementById('date_field_operators').style.display = 'none';
                document.getElementById('set_not_set_operator').style.display = 'none';
                document.getElementById('values_operator').style.display = 'none';
                document.getElementById('id_operator').style.display = 'block';
            }else {
                document.getElementById('o_filter_operator').style.display = 'block';
                document.getElementById('date_field_operators').style.display = 'none';
                document.getElementById('set_not_set_operator').style.display = 'none';
                document.getElementById('values_operator').style.display = 'none';
                document.getElementById('id_operator').style.display = 'none';
            }

            if (selectedValue === 'activity_exception_decoration'){
                document.getElementById('activity_exception_decoration').style.display = 'block';
                document.getElementById('o_filter_value').style.display = 'none';
                document.getElementById('activity_state').style.display = 'none';
                document.getElementById('invoice_status').style.display = 'none';
                document.getElementById('picking_policy').style.display = 'none';
                document.getElementById('state').style.display = 'none';
                document.getElementById('terms_type').style.display = 'none';
                document.getElementById('o_input_date_from').style.display = 'none';
                document.getElementById('o_input_date_to').style.display = 'none';
            } else if (selectedValue === 'activity_state'){
                document.getElementById('activity_exception_decoration').style.display = 'none';
                document.getElementById('o_filter_value').style.display = 'none';
                document.getElementById('activity_state').style.display = 'block';
                document.getElementById('invoice_status').style.display = 'none';
                document.getElementById('picking_policy').style.display = 'none';
                document.getElementById('state').style.display = 'none';
                document.getElementById('terms_type').style.display = 'none';
                document.getElementById('o_input_date_from').style.display = 'none';
                document.getElementById('o_input_date_to').style.display = 'none';
            } else if (selectedValue === 'invoice_status'){
                document.getElementById('activity_exception_decoration').style.display = 'none';
                document.getElementById('o_filter_value').style.display = 'none';
                document.getElementById('activity_state').style.display = 'none';
                document.getElementById('invoice_status').style.display = 'block';
                document.getElementById('picking_policy').style.display = 'none';
                document.getElementById('state').style.display = 'none';
                document.getElementById('terms_type').style.display = 'none';
                document.getElementById('o_input_date_from').style.display = 'none';
                document.getElementById('o_input_date_to').style.display = 'none';
            } else if (selectedValue === 'picking_policy'){
                document.getElementById('activity_exception_decoration').style.display = 'none';
                document.getElementById('o_filter_value').style.display = 'none';
                document.getElementById('activity_state').style.display = 'none';
                document.getElementById('invoice_status').style.display = 'none';
                document.getElementById('picking_policy').style.display = 'block';
                document.getElementById('state').style.display = 'none';
                document.getElementById('terms_type').style.display = 'none';
                document.getElementById('o_input_date_from').style.display = 'none';
                document.getElementById('o_input_date_to').style.display = 'none';
            } else if (selectedValue === 'state'){
                document.getElementById('activity_exception_decoration').style.display = 'none';
                document.getElementById('o_filter_value').style.display = 'none';
                document.getElementById('activity_state').style.display = 'none';
                document.getElementById('invoice_status').style.display = 'none';
                document.getElementById('picking_policy').style.display = 'none';
                document.getElementById('state').style.display = 'block';
                document.getElementById('terms_type').style.display = 'none';
                document.getElementById('o_input_date_from').style.display = 'none';
                document.getElementById('o_input_date_to').style.display = 'none';
            } else if (selectedValue === 'terms_type'){
                document.getElementById('activity_exception_decoration').style.display = 'none';
                document.getElementById('o_filter_value').style.display = 'none';
                document.getElementById('activity_state').style.display = 'none';
                document.getElementById('invoice_status').style.display = 'none';
                document.getElementById('picking_policy').style.display = 'none';
                document.getElementById('state').style.display = 'none';
                document.getElementById('terms_type').style.display = 'block';
                document.getElementById('o_input_date_from').style.display = 'none';
                document.getElementById('o_input_date_to').style.display = 'none';
            } else if(date_fields.includes(selectedValue)){
                document.getElementById('activity_exception_decoration').style.display = 'none';
                document.getElementById('o_filter_value').style.display = 'none';
                document.getElementById('activity_state').style.display = 'none';
                document.getElementById('invoice_status').style.display = 'none';
                document.getElementById('picking_policy').style.display = 'none';
                document.getElementById('state').style.display = 'none';
                document.getElementById('terms_type').style.display = 'none';
                document.getElementById('o_input_date_from').style.display = 'block';
                document.getElementById('o_input_date_to').style.display = 'block';
            } else {
                document.getElementById('activity_exception_decoration').style.display = 'none';
                document.getElementById('o_filter_value').style.display = 'block';
                document.getElementById('activity_state').style.display = 'none';
                document.getElementById('invoice_status').style.display = 'none';
                document.getElementById('picking_policy').style.display = 'none';
                document.getElementById('state').style.display = 'none';
                document.getElementById('terms_type').style.display = 'none';
                document.getElementById('o_input_date_from').style.display = 'none';
                document.getElementById('o_input_date_to').style.display = 'none';
            }

       },

        _ActionFilterApply : function(ev){
            document.getElementById('open_dropdown').style.display='none';
            var self = this;
            var VisibleOperatorID = null;
            var VisibleValueID = null;
            var operatorId = null;
            var valueId = null;
            var operatorToCheck = [
                'o_filter_operator','date_field_operators', 'set_not_set_operator', 'values_operator',
                'id_operator'
            ];

            for (var i = 0; i < operatorToCheck.length; i++) {
                var elementId = operatorToCheck[i];
                var element = document.getElementById(elementId);
                if (element.style.display === 'block') {
                    VisibleOperatorID = element;
                    break;
                }
            }

            if (VisibleOperatorID) {
                operatorId = VisibleOperatorID.id;
            }


            var ValuesToCheck = [
                 'o_filter_value','activity_exception_decoration', 'activity_state',
                'invoice_status', 'picking_policy', 'state', 'terms_type', 'o_input_date_from','o_input_date_from'
            ];

            for (var i = 0; i < ValuesToCheck.length; i++) {
                var elementId = ValuesToCheck[i];
                var element = document.getElementById(elementId);
                if (element.style.display === 'block') {
                    VisibleValueID = element;
                    break;
                }
            }
            if (VisibleValueID) {
                valueId = VisibleValueID.id;
            }

            var field_name = $("#o_filter_field").val();
            var operator = $("#" + operatorId).val();
            var filter_value = $("#" + valueId).val();

            var from_date, date_from, to_date, date_to;
            var filter_options = {
                'field_name' :  field_name,
                'operator' :  operator,
            };
            var domain = [];
            if (operator === 'between') {
                from_date = $(".o_input_date_from").val().trim();
                date_from = moment(from_date, 'YYYY-MM-DDTHH:mm').format('YYYY-MM-DD');

                to_date = $(".o_input_date_to").val().trim();
                date_to = moment(to_date, 'YYYY-MM-DDTHH:mm').format('YYYY-MM-DD');

                filter_options['date_from'] = date_from;
                filter_options['date_to'] = date_to;

                domain = [[filter_options['field_name'], '>' ,filter_options['date_from']] , [filter_options['field_name'], '<',filter_options['date_to']]]

            } else if (operatorId === 'date_field_operators' && operator !== 'between'){
                from_date = $(".o_input_date_from").val().trim();
                date_from = moment(from_date, 'YYYY-MM-DDTHH:mm').format('YYYY-MM-DD');
                filter_options['date_from'] = date_from;
                domain = [[filter_options['field_name'], filter_options['operator'],filter_options['date_from']]]
            } else {
                filter_options['filter_value'] = filter_value;
                domain = [[filter_options['field_name'], filter_options['operator'],filter_options['filter_value']]]
            }

            pdf_filter = domain
            pdf_multi_filter = true

            console.log("Domain", domain)

            self._rpc({
                model: 'sale.order',
                method: 'search_read',
                domain: domain,
                fields: ['name', 'partner_id', 'date_order', 'user_id', 'state', 'invoice_status', 'amount_total', 'order_line']
            }).then(function (orders) {
                orders.sort(function (a, b) {
                    return b.amount_total - a.amount_total;
                });
                self._updateSalesOrders(orders);
            });

            var multi_filter = true;
            self._rpc({
                   model: 'sale_custom.dashboard',
                   method: 'get_top_products_by_value_dt',
                   args: [domain],
                   context: { multi_filter: multi_filter }
              }).then(function (top_products) {
                  self._updateTopProductsByValue(top_products);
            });

            self._rpc({
                model: 'sale_custom.dashboard',
                method:'get_top_customers_by_value_dt',
                args: [domain],
                context: { multi_filter: multi_filter}
                }).then(function (top_customers) {
                  self._updateTopCustomersByValue(top_customers);
            });

             self._rpc({
                model: 'sale_custom.dashboard',
                method: 'get_top_products_by_quantity_dt',
                args: [domain],
                context: { multi_filter: multi_filter}
            }).then(function (top_products) {
                self._updateTopProductsByQuantity(top_products);
            });

            self._rpc({
                model: 'sale_custom.dashboard',
                method: 'get_sales_summary',
                args: [domain],
                context: { multi_filter: multi_filter}
            }).then(function (sales_summary) {
                self._updateSalesSummary(sales_summary);
                self._updateSalesStatusCard(sales_summary.sales_details.o_sales_details);
            });

        },

        _OverallDateRangeApplyFilters: function (ev) {
            var self = this;
            var from_date, date_from, to_date, date_to;
            if ($(".datetimepicker-input[name='date_from']").length) {
                from_date = $(".datetimepicker-input[name='date_from']").val().trim();
                date_from = moment(from_date, time.getLangDateFormat()).format('YYYY-MM-DD');
            }
            if ($(".datetimepicker-input[name='date_to']").length) {
                to_date = $(".datetimepicker-input[name='date_to']").val().trim();
                date_to = moment(to_date, time.getLangDateFormat()).format('YYYY-MM-DD');
            }

            var filter_data = {
                'date_from': date_from,
                'date_to': date_to,
            };
            pdf_filter = filter_data
            pdf_multi_filter = false;

            self._rpc({
                model: 'sale.order',
                method: 'search_read',
                domain: [['date_order', '>=', date_from], ['date_order', '<=', date_to]],
                fields: ['name', 'partner_id', 'date_order', 'user_id', 'state', 'invoice_status', 'amount_total']
            }).then(function (orders) {
                 orders.sort(function (a, b) {
                    return b.amount_total - a.amount_total;
                });
                self._updateSalesOrders(orders);
            });

            self._SalesTopProductsByValueFilter(filter_data);

            self._rpc({
                model: 'sale_custom.dashboard',
                method: 'get_top_products_by_quantity_dt',
                args: [filter_data]
            }).then(function (top_products) {
                self._updateTopProductsByQuantity(top_products);
            });

            self._rpc({
                model: 'sale_custom.dashboard',
                method: 'get_top_customers_by_value_dt',
                args: [filter_data]
            }).then(function (top_customers) {
                self._updateTopCustomersByValue(top_customers);
            });

            self._rpc({
                model: 'sale_custom.dashboard',
                method: 'get_sales_summary',
                args: [filter_data]
            }).then(function (sales_summary) {
                self._updateSalesSummary(sales_summary);
                self._updateSalesStatusCard(sales_summary.sales_details.o_sales_details);
            });


        },

        _updateSalesStatusCard: function (salesStatusDetails) {
            var self = this;

            var $QuotationStatusCardRow = $('.quotation-status-section');
            $QuotationStatusCardRow.empty();
            $QuotationStatusCardRow.append(QWeb.render('QuotationStatusRow', {
                    o_quotation: salesStatusDetails['o_quotation'],
                    quotation_ids : salesStatusDetails['quotation_ids'],
                    o_quotation_percent : salesStatusDetails['o_quotation_percent'],
            }));

            var $SentStatusCardRow = $('.sent-status-section');
            $SentStatusCardRow.empty();
            $SentStatusCardRow.append(QWeb.render('SentStatusRow', {
                    o_sent: salesStatusDetails['o_sent'],
                    sent_ids : salesStatusDetails['sent_ids'],
                    o_sent_percent : salesStatusDetails['o_sent_percent'],
            }));

            var $SaleStatusCardRow = $('.sales-status-section');
            $SaleStatusCardRow.empty();
            $SaleStatusCardRow.append(QWeb.render('SaleStatusRow', {
                    o_sale: salesStatusDetails['o_sale'],
                    sale_ids : salesStatusDetails['sale_ids'],
                    o_sale_percent : salesStatusDetails['o_sale_percent'],
            }));

            var $DoneStatusCardRow = $('.done-status-section');
            $DoneStatusCardRow.empty();
            $DoneStatusCardRow.append(QWeb.render('DoneStatusRow', {
                    o_done: salesStatusDetails['o_done'],
                    done_ids : salesStatusDetails['done_ids'],
                    o_done_percent : salesStatusDetails['o_done_percent'],
            }));

            var $CancelStatusCardRow = $('.cancel-status-section');
            $CancelStatusCardRow.empty();
            $CancelStatusCardRow.append(QWeb.render('CancelStatusRow', {
                    o_cancel: salesStatusDetails['o_cancel'],
                    cancel_ids : salesStatusDetails['cancel_ids'],
                    o_cancel_percent : salesStatusDetails['o_cancel_percent'],
            }));

            var $UpsellingStatusCardRow = $('.upselling-status-section');
            $UpsellingStatusCardRow.empty();
            $UpsellingStatusCardRow.append(QWeb.render('UpsellingStatusRow', {
                    o_upselling: salesStatusDetails['o_upselling'],
                    upselling_ids : salesStatusDetails['upselling_ids'],
                    o_upselling_percent : salesStatusDetails['o_upselling_percent'],
            }));

            var $InvoicedStatusCardRow = $('.invoiced-status-section');
            $InvoicedStatusCardRow.empty();
            $InvoicedStatusCardRow.append(QWeb.render('InvoiceStatusRow', {
                    o_invoiced: salesStatusDetails['o_invoiced'],
                    invoiced_ids : salesStatusDetails['invoiced_ids'],
                    o_invoiced_percent : salesStatusDetails['o_invoiced_percent'],
            }));

            var $ToInvoiceStatusCardRow = $('.to_invoice-status-section');
            $ToInvoiceStatusCardRow.empty();
            $ToInvoiceStatusCardRow.append(QWeb.render('ToInvoiceStatusRow', {
                    o_to_invoice: salesStatusDetails['o_to_invoice'],
                    to_invoice_ids : salesStatusDetails['to_invoice_ids'],
                    o_to_invoice_percent : salesStatusDetails['o_to_invoice_percent'],
            }));

            var $NoToInvoiceStatusCardRow = $('.no-status-section');
            $NoToInvoiceStatusCardRow.empty();
            $NoToInvoiceStatusCardRow.append(QWeb.render('NoToInvoiceStatusRow', {
                    o_no: salesStatusDetails['o_no'],
                    no_ids : salesStatusDetails['no_ids'],
                    o_no_percent : salesStatusDetails['o_no_percent'],
            }));

            var $TotalSalesStatus = $('.total-sales-section');
            $TotalSalesStatus.empty();
            console.log("salesStatusDetails['total_sales'],", salesStatusDetails['total_sales'])
            console.log("salesStatusDetails['total_sales_ids'],", salesStatusDetails['total_sales_ids'])
            $TotalSalesStatus.append(QWeb.render('TotalSalesStatusRow', {
                    total_sales: salesStatusDetails['total_sales'],
                    total_sales_ids : salesStatusDetails['total_sales_ids'],
            }));
        },

        _SalesTopProductsByValueFilter : function (filter_data){
            var self = this;
            self._rpc({
                model: 'sale_custom.dashboard',
                method: 'get_top_products_by_value_dt',
                args: [filter_data],

            }).then(function (top_products) {
                self._updateTopProductsByValue(top_products);
            });
        },

        _updateSalesOrders: function (orders) {
            var $tbody = this.$('.top_sales_main_view tbody');
            $tbody.empty();
            var sl_no = 1;
            _.each(orders, function (order) {
                $tbody.append(QWeb.render('SalesOrderRow', {
                    sl_no: sl_no++,
                    order: order
                }));
            });
        },

        _updateTopProductsByValue: function (products) {
            var $tbody = this.$('.top_products_by_value tbody');
            $tbody.empty();
            var sl_no = 1;
            _.each(products, function (product) {
                $tbody.append(QWeb.render('TopProductRow', {
                    sl_no: sl_no++,
                    product: product
                }));
            });
        },

        _updateTopProductsByQuantity: function (products) {
            var $tbody = this.$('.top_products_by_quantity tbody');
            $tbody.empty();
            var sl_no = 1;
            _.each(products, function (product) {
                $tbody.append(QWeb.render('TopProductQtyRow', {
                    sl_no: sl_no++,
                    product: product
                }));
            });
        },

        _updateTopCustomersByValue: function (customers) {
            var $tbody = this.$('.top_customers_by_value tbody');
            $tbody.empty();
            var sl_no = 1;
            _.each(customers.top_customers_by_value, function (customer) {
                $tbody.append(QWeb.render('TopCustomerRow', {
                    sl_no: sl_no++,
                    customer: customer
                }));
            });

            var $region_tbody = this.$('.top_regions_by_value tbody');
            $region_tbody.empty();
            var reg_sl_no = 1;
            _.each(customers.top_regions_by_value, function (region) {
                $region_tbody.append(QWeb.render('TopRegionRow', {
                    sl_no: reg_sl_no++,
                    region: region
                }));
            });

            var $country_tbody = this.$('.top_countries_by_value tbody');
            $country_tbody.empty();
            var country_sl_no = 1;
            _.each(customers.top_countries_by_value, function (country) {
                $country_tbody.append(QWeb.render('TopCountryRow', {
                    sl_no: country_sl_no++,
                    country: country
                }));
            });
        },

        _updateSalesSummary: function (sales_summarys) {
            var $tbody = this.$('.card_main_view_section div');
            $tbody.empty();
            _.each(sales_summarys, function (sales_summary) {
                $tbody.append(QWeb.render('CardMainViewSection', {
                    sales_summary: sales_summary
                }));
            });
        },

        _PrintPdfReport: function(ev) {
            var self = this;
            if (pdf_multi_filter === true) {
                self._rpc({
                model: 'sale_custom.dashboard',
                method: 'get_report_data',
                args: [pdf_filter],
                context: { multi_filter: pdf_multi_filter}
                }).then(function(data) {
                    self._generate_pdf_data(data)
                });
            } else {
                self._rpc({
                model: 'sale_custom.dashboard',
                method: 'get_report_data',
                args: [pdf_filter],
                }).then(function(data) {
                   self._generate_pdf_data(data)
                });
            }
		},

		_generate_pdf_data: function (data) {
            var self = this;
            var action = {
                        'type': 'ir.actions.report',
                        'report_type': 'qweb-pdf',
                        'report_name': 'advance_sales_dashboard.sale_order_report',
                        'report_file': 'advance_sales_dashboard.sale_order_report',
                        'paperformat_id': 'advance_sales_dashboard.sales_dashboard_pdf_paperformat',
                        'data': {
                            'report_data': data
                        },
                        'context': {
                            'active_model': 'sale_custom.dashboard',
                            'sale_order_report': true
                        },
                        'display_name': 'Sale Order',
                    };
            return self.do_action(action);
        },

		_PrintXlsxReport: function(ev) {
            var self = this;
            if (pdf_multi_filter === true) {
                self._rpc({
                model: 'sale_custom.dashboard',
                method: 'get_report_data',
                args: [pdf_filter],
                context: { multi_filter: pdf_multi_filter}
                }).then(function(data) {
                    self._generate_xlsx_data(data)
                });
            } else {
                self._rpc({
                model: 'sale_custom.dashboard',
                method: 'get_report_data',
                args: [pdf_filter],
                }).then(function(data) {
                   self._generate_xlsx_data(data)
                });
            }

		},

		_generate_xlsx_data: function(data){
		    var self = this;
		    var action = {
                  'data': {
                            'model': 'sale_custom.dashboard',
                            'output_format': 'xlsx',
                            'report_data': JSON.stringify(data),
                            'report_name': 'Sale Report',
                        },
                  };
            self.downloadXlsx(action);
		},

        downloadXlsx: function (action){
        framework.blockUI();
            session.get_file({
                url: '/sale_dashboard_xlsx_reports',
                data: action.data,
                complete: framework.unblockUI,
                error: (error) => this.call('crash_manager', 'rpc_error', error),
            });
        },


        _onClickInput: function(){
            var self = this;
            var input = $(".input-search").val();
            var fields = [];
            rpc.query({
               model: 'search.record',
               method: 'search_read',
               args: [fields],
            }).then(function (Result) {
                var modelNames = Result.map(model => model.model_name);
                if (input) {
                    document.getElementById('drop_list').style.display='block';
                    var resultsByModel = {};
                    modelNames.forEach(function(modelName) {
                        rpc.query({
                            model: modelName,
                            method: 'search_read',
                            args: [[['name', 'ilike', input]]],
                        }).then(function (Result) {
                            if (Result.length !== 0){
                                resultsByModel[modelName] = Result;
                                renderResults(resultsByModel);
                            }
                        })
                    })
                } else {
                    document.getElementById('drop_list').style.display='none';
                }

            })

            function renderResults(resultsByModel) {
                $('.dropdown_view').empty();
                Object.keys(resultsByModel).forEach(function(modelName) {
                    var results = resultsByModel[modelName];
                    var Div = document.createElement('div');
                    results.forEach(function(result) {
                         rpc.query({
                           model: 'ir.model',
                           method: 'search_read',
                           args: [[['model', '=', modelName]]],
                           }).then(function (Result) {
                                var name = Result[0]['name'];
                                var tag = document.createElement('div');
                                tag.classList.add("search_tag");
                                var resultText = document.createTextNode(name+ "/" + result.name);
                                tag.setAttribute("id", result.id);
                                tag.append(resultText);
                                Div.append(tag);
                           })
                    });
                    $('.dropdown_view').append(Div);
                });
            }
        },

        _Close_button: function(){
              document.getElementById('drop_list').style.display='none';
       },

       _OnClickSearch: function(ev){
            var self = this;
            var input = $(".input-search").val().trim();
            var inputValues = input.split(',').map(value => value.trim());
    //        var domain = inputValues.length === 1 ? [['name', 'ilike', inputValues[0]]] : [['name', 'in', inputValues]];
            var domain = inputValues.length === 1 ? [['name', '=', inputValues[0]]] : [['name', 'in', inputValues]];
            var fields = [];
            rpc.query({
               model: 'search.record',
               method: 'search_read',
               args: [fields],
                }).then(function (Result) {
                    var modelNames = Result.map(model => model.model_name);
                    modelNames.forEach(function(modelName) {
                           rpc.query({
                           model: modelName,
                           method: 'search_read',
                           args: [domain],
                           }).then(function (Result) {
                                if (Result.length !== 0){
                                    var res_ids = Result.map(function(item) {return item.id;});
                                    var current_model = modelName
                                    self._passvalue(current_model, res_ids);
                                    document.getElementById('drop_list').style.display='none';
                                }
                           })
                    })
                })
       },

        _passvalue: function(current_model, res_ids){
           var self = this;
           rpc.query({
                   model: 'ir.model',
                   method: 'search_read',
                   args: [[['model', '=', current_model]]],
                   }).then(function (Result) {
                        var name = Result[0]['name'];
                        self._openAction(name, current_model, res_ids);
                   })
        },

       _openAction: function(name, current_model, res_ids){
            var self = this;
            self.do_action({
                 type: 'ir.actions.act_window',
                 name: name,
                 res_model: current_model,
                  domain: [['id', 'in',  res_ids]],
                  views: [[false, 'list'], [false, 'form']],
                  target: 'current',
            });
            $(".input-search").val('');
       },

       _SelectDropDownClick: function(ev){
            var name = $(ev.currentTarget).text();
            var firstSlashIndex = name.indexOf('/');
            if (firstSlashIndex !== -1) {
                    var trimmedName = name.substring(firstSlashIndex + 1).trim();
                    $(".input-search").val(trimmedName);
            } else {
                    $(".input-search").val(name.trim());
                }
            document.getElementById('drop_list').style.display='none';
       },

        _openAction: function(name, res_model, id) {
            this.do_action({
                type: 'ir.actions.act_window',
                name: _t(name),
                res_model: res_model,
                domain: [['id', '=',  id]],
                views: [[false, 'list'], [false, 'form']],
                target: 'current',
            });
        },

        _OpenWizard: function () {
            var self = this;
            this.do_action({
               type: 'ir.actions.act_window',
               res_model: 'pdf.reports.wizard',
               name :'Print PDF Reports',
               view_mode: 'form',
               view_type: 'form',
               views: [[false, 'form']],
               target: 'new',
               res_id: false,
           });
        },

         _LogOutMenu: function () {
            var self = this;
            var route = "/web/session/logout";
            this.do_action({
                type: "ir.actions.act_url",
                name: _t("Log out"),
                target: "self",
                url: route,
            });
        },

        _ToogleClick: function toggle() {
          let menuToggle = document.getElementsByClassName('menu_toggle')[0];
          let top = document.getElementsByClassName('line')[0];
          let bottom = document.getElementsByClassName('line')[1];
          let menu = document.getElementsByClassName('menu')[0];
          menuToggle.addEventListener('click', function() {
            top.classList.add('active_line_top');
            bottom.classList.add('active_line_bottom');
            menu.classList.add('acive_menu');
            top.classList.remove('close_top');
            bottom.classList.remove('close_bottom');
          });
          menu.addEventListener('click', function() {
            top.classList.remove('active_line_top');
            bottom.classList.remove('active_line_bottom');
            menu.classList.remove('acive_menu');
            top.classList.add('close_top');
            bottom.classList.add('close_bottom');
          });
        }
    });

    core.action_registry.add('advance_sales_dashboard.dashboard', DashBoard);
    return DashBoard;
});