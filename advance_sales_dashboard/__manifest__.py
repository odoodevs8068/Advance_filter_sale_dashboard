{
    'name': 'Advance Filter Sales Dashboard',
    'version': '1.2',
    'summary': 'Advance Sales Dashboard With Multi Filter Options/Dashboard PDF/XLSX Report/Yearly Chart Views',
    'sequence': 5,
    'author': "JD DEVS",
    'currency': "USD",
    'price': "5.0",
    'depends': ['base', 'sale', 'account', 'report_xlsx', 'product'],
    'data': [
        'views/dashboards.xml',
        'data/search_record_data.xml',
        'data/report_paperformat.xml',
        'security/ir.model.access.csv',
        'wizards/print_wizard.xml',
        'reports/reports.xml',
        'reports/sale_dashboard_report.xml',
    ],
    'assets': {
        'web.assets_backend': [
            "advance_sales_dashboard/static/css/overview.css",
            "advance_sales_dashboard/static/css/sale_view.css",
            "advance_sales_dashboard/static/css/chart_card.css",

            "advance_sales_dashboard/static/js/tree_view_button.js",
            "advance_sales_dashboard/static/js/sale_dashboard.js",

            "https://www.gstatic.com/charts/loader.js",
            "https://cdn.jsdelivr.net/npm/chart.js",
            "https://cdn.jsdelivr.net/npm/chart.js@4.0.1/dist/chart.umd.min.js",
            "https://cdn.jsdelivr.net/npm/chartjs-plugin-datalabels/dist/chartjs-plugin-datalabels.min.js",
        ],

        'web.assets_qweb': [
            "advance_sales_dashboard/static/xml/tree_view_button.xml",
            "advance_sales_dashboard/static/xml/sale_dashboard.xml",
        ],
    },
    'installable': True,
    'application': True,
    'auto_install': False,
    'license': 'AGPL-3',
    'images': ['static/description/assets/screenshots/banner.png'],
}
