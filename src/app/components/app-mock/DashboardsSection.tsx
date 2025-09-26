'use client';

import { useEffect, useRef, useState } from 'react';
import VChart from '@visactor/vchart';

interface DashboardChart {
  id: string;
  title: string;
  spec: any;
  description: string;
}

// Mock dashboard charts with different VChart types
const dashboardCharts: DashboardChart[] = [
  {
    id: 'sales-overview',
    title: 'Sales Overview',
    description: 'Monthly revenue trends across different product categories',
    spec: {
      type: 'line',
      data: [
        {
          values: [
            { month: 'Jan', revenue: 125000, category: 'Electronics' },
            { month: 'Feb', revenue: 132000, category: 'Electronics' },
            { month: 'Mar', revenue: 128000, category: 'Electronics' },
            { month: 'Apr', revenue: 145000, category: 'Electronics' },
            { month: 'May', revenue: 152000, category: 'Electronics' },
            { month: 'Jun', revenue: 148000, category: 'Electronics' },
            { month: 'Jan', revenue: 85000, category: 'Clothing' },
            { month: 'Feb', revenue: 92000, category: 'Clothing' },
            { month: 'Mar', revenue: 88000, category: 'Clothing' },
            { month: 'Apr', revenue: 95000, category: 'Clothing' },
            { month: 'May', revenue: 102000, category: 'Clothing' },
            { month: 'Jun', revenue: 98000, category: 'Clothing' },
            { month: 'Jan', revenue: 65000, category: 'Home & Garden' },
            { month: 'Feb', revenue: 72000, category: 'Home & Garden' },
            { month: 'Mar', revenue: 68000, category: 'Home & Garden' },
            { month: 'Apr', revenue: 75000, category: 'Home & Garden' },
            { month: 'May', revenue: 82000, category: 'Home & Garden' },
            { month: 'Jun', revenue: 78000, category: 'Home & Garden' },
          ]
        }
      ],
      xField: 'month',
      yField: 'revenue',
      seriesField: 'category',
      legends: { visible: true, orient: 'bottom' },
      axes: [
        { orient: 'left', title: { visible: true, text: 'Revenue ($)' } },
        { orient: 'bottom', title: { visible: true, text: 'Month' } }
      ]
    }
  },
  {
    id: 'market-share',
    title: 'Market Share Distribution',
    description: 'Current market share breakdown by product category',
    spec: {
      type: 'pie',
      data: [
        {
          values: [
            { category: 'Electronics', value: 145000, percentage: 35 },
            { category: 'Clothing', value: 95000, percentage: 23 },
            { category: 'Home & Garden', value: 75000, percentage: 18 },
            { category: 'Sports', value: 62000, percentage: 15 },
            { category: 'Books', value: 38000, percentage: 9 }
          ]
        }
      ],
      valueField: 'value',
      categoryField: 'category',
      legends: { visible: true, orient: 'right' },
      label: {
        visible: true,
        style: { fontSize: 12 }
      }
    }
  },
  {
    id: 'regional-performance',
    title: 'Regional Performance',
    description: 'Sales performance comparison across different regions',
    spec: {
      type: 'bar',
      data: [
        {
          values: [
            { region: 'North', q1: 125000, q2: 135000, q3: 142000, q4: 158000 },
            { region: 'South', q1: 98000, q2: 105000, q3: 112000, q4: 125000 },
            { region: 'East', q1: 88000, q2: 92000, q3: 98000, q4: 108000 },
            { region: 'West', q1: 76000, q2: 82000, q3: 88000, q4: 95000 }
          ]
        }
      ],
      xField: 'region',
      yField: ['q1', 'q2', 'q3', 'q4'],
      legends: { visible: true, orient: 'bottom' },
      axes: [
        { orient: 'left', title: { visible: true, text: 'Sales ($)' } },
        { orient: 'bottom', title: { visible: true, text: 'Region' } }
      ]
    }
  },
  {
    id: 'customer-segments',
    title: 'Customer Segments',
    description: 'Customer distribution by age groups and purchase behavior',
    spec: {
      type: 'scatter',
      data: [
        {
          values: [
            { age: 25, purchases: 12, spending: 2500, segment: 'Young Professional' },
            { age: 28, purchases: 18, spending: 3200, segment: 'Young Professional' },
            { age: 32, purchases: 15, spending: 2800, segment: 'Young Professional' },
            { age: 35, purchases: 22, spending: 4500, segment: 'Young Professional' },
            { age: 42, purchases: 28, spending: 5200, segment: 'Family' },
            { age: 45, purchases: 32, spending: 6100, segment: 'Family' },
            { age: 48, purchases: 25, spending: 4800, segment: 'Family' },
            { age: 38, purchases: 35, spending: 6800, segment: 'Family' },
            { age: 55, purchases: 45, spending: 8500, segment: 'Premium' },
            { age: 58, purchases: 52, spending: 9200, segment: 'Premium' },
            { age: 62, purchases: 38, spending: 7200, segment: 'Premium' },
            { age: 65, purchases: 42, spending: 8100, segment: 'Premium' }
          ]
        }
      ],
      xField: 'age',
      yField: 'purchases',
      sizeField: 'spending',
      seriesField: 'segment',
      size: { range: [10, 30] },
      legends: { visible: true, orient: 'bottom' },
      axes: [
        { orient: 'left', title: { visible: true, text: 'Number of Purchases' } },
        { orient: 'bottom', title: { visible: true, text: 'Age' } }
      ]
    }
  },
  {
    id: 'inventory-heatmap',
    title: 'Inventory Heatmap',
    description: 'Product availability across different store locations',
    spec: {
      type: 'heatmap',
      data: [
        {
          values: [
            { store: 'Store A', product: 'Product 1', stock: 85 },
            { store: 'Store A', product: 'Product 2', stock: 92 },
            { store: 'Store A', product: 'Product 3', stock: 78 },
            { store: 'Store A', product: 'Product 4', stock: 65 },
            { store: 'Store A', product: 'Product 5', stock: 88 },
            { store: 'Store B', product: 'Product 1', stock: 72 },
            { store: 'Store B', product: 'Product 2', stock: 86 },
            { store: 'Store B', product: 'Product 3', stock: 94 },
            { store: 'Store B', product: 'Product 4', stock: 58 },
            { store: 'Store B', product: 'Product 5', stock: 81 },
            { store: 'Store C', product: 'Product 1', stock: 96 },
            { store: 'Store C', product: 'Product 2', stock: 74 },
            { store: 'Store C', product: 'Product 3', stock: 82 },
            { store: 'Store C', product: 'Product 4', stock: 91 },
            { store: 'Store C', product: 'Product 5', stock: 67 },
            { store: 'Store D', product: 'Product 1', stock: 63 },
            { store: 'Store D', product: 'Product 2', stock: 89 },
            { store: 'Store D', product: 'Product 3', stock: 76 },
            { store: 'Store D', product: 'Product 4', stock: 84 },
            { store: 'Store D', product: 'Product 5', stock: 93 }
          ]
        }
      ],
      xField: 'product',
      yField: 'store',
      valueField: 'stock',
      legends: { visible: true, orient: 'bottom' },
      axes: [
        { orient: 'bottom', title: { visible: true, text: 'Product' } },
        { orient: 'left', title: { visible: true, text: 'Store Location' } }
      ]
    }
  }
];

interface ChartComponentProps {
  chart: DashboardChart;
  width?: number;
  height?: number;
}

function ChartComponent({ chart, width = 400, height = 300 }: ChartComponentProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const vchartInstance = useRef<any>(null);

  useEffect(() => {
    const renderChart = async () => {
      if (!chartRef.current) return;

      try {
        // Clean up previous chart instance
        if (vchartInstance.current) {
          vchartInstance.current.release();
          vchartInstance.current = null;
        }

        // Clear the container
        if (chartRef.current) {
          chartRef.current.innerHTML = '';
        }

        // Create chart spec with dimensions
        const finalSpec = {
          ...chart.spec,
          width,
          height,
          autoFit: false,
          animation: true,
          padding: { top: 20, right: 20, bottom: 40, left: 50 }
        };

        // Create new chart instance
        vchartInstance.current = new VChart(finalSpec, {
          dom: chartRef.current,
          mode: 'desktop-browser',
          dpr: window.devicePixelRatio || 1,
        });

        // Render the chart
        await vchartInstance.current.renderAsync();
      } catch (err) {
        console.error('Error rendering chart:', err);
      }
    };

    renderChart();

    // Cleanup on unmount
    return () => {
      if (vchartInstance.current) {
        vchartInstance.current.release();
        vchartInstance.current = null;
      }
    };
  }, [chart, width, height]);

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
      <div className="p-4 bg-gradient-to-r from-gray-50 to-white border-b border-gray-200">
        <h3 className="text-lg font-bold text-gray-900">{chart.title}</h3>
        <p className="text-sm text-gray-600 mt-1">{chart.description}</p>
      </div>
      <div className="p-4">
        <div
          ref={chartRef}
          className="w-full"
          style={{ width: `${width}px`, height: `${height}px` }}
        />
      </div>
    </div>
  );
}

// Date filter types
type DateRange = {
  start: Date;
  end: Date;
  label: string;
};

type DateFilterType = 'last7days' | 'last30days' | 'last3months' | 'last6months' | 'lastyear' | 'custom';

export default function DashboardsSection() {
  const [selectedDashboard, setSelectedDashboard] = useState('executive-overview');
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [generateStep, setGenerateStep] = useState<'source' | 'upload' | 'configure' | 'generating'>('source');
  const [selectedDataSource, setSelectedDataSource] = useState<string>('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dashboardConfig, setDashboardConfig] = useState({
    name: '',
    description: '',
    type: 'business-overview'
  });

  // Date filtering state
  const [selectedDateFilter, setSelectedDateFilter] = useState<DateFilterType>('last30days');
  const [customDateRange, setCustomDateRange] = useState<DateRange>({
    start: new Date(new Date().setDate(new Date().getDate() - 30)),
    end: new Date(),
    label: 'Custom Range'
  });
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Close date picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (showDatePicker && !target.closest('.date-picker-container')) {
        setShowDatePicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showDatePicker]);

  // Date filter options
  const dateFilterOptions: { id: DateFilterType; label: string; days?: number }[] = [
    { id: 'last7days', label: 'Last 7 Days', days: 7 },
    { id: 'last30days', label: 'Last 30 Days', days: 30 },
    { id: 'last3months', label: 'Last 3 Months', days: 90 },
    { id: 'last6months', label: 'Last 6 Months', days: 180 },
    { id: 'lastyear', label: 'Last Year', days: 365 },
    { id: 'custom', label: 'Custom Range' }
  ];

  // Get current date range based on selected filter
  const getCurrentDateRange = (): DateRange => {
    const end = new Date();
    let start = new Date();

    const option = dateFilterOptions.find(opt => opt.id === selectedDateFilter);
    if (option?.days) {
      start.setDate(end.getDate() - option.days);
      return { start, end, label: option.label };
    }

    if (selectedDateFilter === 'custom') {
      return customDateRange;
    }

    // Default to last 30 days
    start.setDate(end.getDate() - 30);
    return { start, end, label: 'Last 30 Days' };
  };

  const currentDateRange = getCurrentDateRange();

  // Function to filter chart data based on selected date range
  const filterChartData = (chart: DashboardChart): DashboardChart => {
    const { start, end } = currentDateRange;

    // For demo purposes, we'll simulate filtering by generating data based on date range
    if (chart.id === 'sales-overview') {
      const months = Math.max(1, Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 30)));
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

      const values: Array<{ month: string; revenue: number; category: string }> = [];
      const categories = ['Electronics', 'Clothing', 'Home & Garden'];

      for (let i = 0; i < Math.min(months, 12); i++) {
        const monthIndex = (new Date().getMonth() - months + i + 1 + 12) % 12;
        const month = monthNames[monthIndex];

        categories.forEach(category => {
          const baseValue = category === 'Electronics' ? 140000 :
                           category === 'Clothing' ? 95000 : 75000;
          const variation = (Math.random() - 0.5) * 0.3; // ±15% variation
          const value = Math.round(baseValue * (1 + variation));

          values.push({ month, revenue: value, category });
        });
      }

      return {
        ...chart,
        spec: {
          ...chart.spec,
          data: [{ values }]
        }
      };
    }

    // For other charts, return as is for now (could implement similar filtering logic)
    return chart;
  };

  // Function to simulate data refresh based on date filter
  const getFilteredInsights = () => {
    const days = Math.floor((currentDateRange.end.getTime() - currentDateRange.start.getTime()) / (1000 * 60 * 60 * 24));

    if (days <= 7) {
      return [
        {
          type: 'growth',
          title: 'Weekly Performance',
          message: 'Electronics sales up 12% this week compared to previous week',
          icon: '📈',
          color: 'green'
        },
        {
          type: 'alert',
          title: 'Short-term Trend',
          message: 'Daily fluctuations normal, weekend sales typically 25% higher',
          icon: '📊',
          color: 'blue'
        },
        {
          type: 'warning',
          title: 'Inventory Notice',
          message: 'Fast-moving items may need restocking within 2-3 days',
          icon: '⚠️',
          color: 'yellow'
        }
      ];
    } else if (days <= 30) {
      return [
        {
          type: 'growth',
          title: 'Revenue Growth',
          message: 'Electronics category showing 18% growth compared to last period',
          icon: '📈',
          color: 'green'
        },
        {
          type: 'opportunity',
          title: 'Market Opportunity',
          message: 'North region has highest potential for expansion',
          icon: '🎯',
          color: 'blue'
        },
        {
          type: 'warning',
          title: 'Inventory Alert',
          message: 'Store D showing low stock levels for Product 1',
          icon: '⚠️',
          color: 'yellow'
        }
      ];
    } else {
      return [
        {
          type: 'growth',
          title: 'Long-term Growth',
          message: 'Consistent upward trend across all categories over the selected period',
          icon: '📈',
          color: 'green'
        },
        {
          type: 'trend',
          title: 'Seasonal Patterns',
          message: 'Clear seasonal patterns identified - summer peaks for outdoor products',
          icon: '📊',
          color: 'blue'
        },
        {
          type: 'strategic',
          title: 'Strategic Insights',
          message: 'Customer lifetime value increased 23% in long-term analysis',
          icon: '🎯',
          color: 'purple'
        }
      ];
    }
  };

  const filteredInsights = getFilteredInsights();

  const dashboards = [
    {
      id: 'executive-overview',
      name: 'Executive Overview',
      description: 'High-level business metrics and KPIs',
      icon: '📊'
    },
    {
      id: 'sales-analytics',
      name: 'Sales Analytics',
      description: 'Detailed sales performance analysis',
      icon: '💰'
    },
    {
      id: 'customer-insights',
      name: 'Customer Insights',
      description: 'Customer behavior and segmentation',
      icon: '👥'
    }
  ];

  const dataSources = [
    {
      id: 'upload-csv',
      name: 'Upload CSV File',
      description: 'Upload a CSV file from your computer',
      icon: '📁',
      type: 'upload'
    },
    {
      id: 'google-sheets',
      name: 'Google Sheets',
      description: 'Connect to Google Sheets',
      icon: '📊',
      type: 'integration'
    },
    {
      id: 'salesforce',
      name: 'Salesforce',
      description: 'Import data from Salesforce CRM',
      icon: '☁️',
      type: 'integration'
    },
    {
      id: 'postgresql',
      name: 'PostgreSQL',
      description: 'Connect to PostgreSQL database',
      icon: '🐘',
      type: 'database'
    },
    {
      id: 'mysql',
      name: 'MySQL',
      description: 'Connect to MySQL database',
      icon: '🗃️',
      type: 'database'
    },
    {
      id: 'existing-dataset',
      name: 'Existing Dataset',
      description: 'Use a previously uploaded dataset',
      icon: '💾',
      type: 'existing'
    }
  ];

  const dashboardTypes = [
    {
      id: 'business-overview',
      name: 'Business Overview',
      description: 'Key metrics and KPIs for business performance',
      charts: ['Revenue Trends', 'Sales Funnel', 'Top Products', 'Regional Performance']
    },
    {
      id: 'sales-dashboard',
      name: 'Sales Dashboard',
      description: 'Comprehensive sales analytics and forecasting',
      charts: ['Sales Pipeline', 'Conversion Rates', 'Team Performance', 'Revenue Forecast']
    },
    {
      id: 'customer-analytics',
      name: 'Customer Analytics',
      description: 'Customer behavior and segmentation insights',
      charts: ['Customer Segments', 'Retention Analysis', 'Lifetime Value', 'Satisfaction Scores']
    },
    {
      id: 'financial-reporting',
      name: 'Financial Reporting',
      description: 'Financial metrics and budget tracking',
      charts: ['P&L Summary', 'Budget vs Actual', 'Cash Flow', 'Expense Breakdown']
    }
  ];

  const handleGenerateDashboard = async () => {
    setGenerateStep('generating');

    // Simulate dashboard generation process
    const steps = [
      'Analyzing data structure...',
      'Identifying key metrics...',
      'Generating chart specifications...',
      'Creating dashboard layout...',
      'Finalizing dashboard...'
    ];

    for (let i = 0; i < steps.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      // Could show progress here
    }

    // Close modal and show success
    setShowGenerateModal(false);
    setGenerateStep('source');
    setSelectedDataSource('');
    setDashboardConfig({
      name: '',
      description: '',
      type: 'business-overview'
    });

    // Could add the new dashboard to the list here
    alert(`Dashboard "${dashboardConfig.name}" generated successfully!`);
  };

  const handleFileUpload = async () => {
    setUploadProgress(0);

    // Simulate file upload
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => setGenerateStep('configure'), 500);
          return 100;
        }
        return prev + 10;
      });
    }, 150);
  };

  return (
    <div className="flex h-full">
      {/* Dashboard Sidebar */}
      <div className="w-80 bg-gradient-to-br from-gray-50 to-white border-r border-gray-200 p-6 overflow-y-auto">
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Dashboards</h2>
            <p className="text-sm text-gray-600">Explore pre-built analytics dashboards</p>
          </div>

          {/* Dashboard List */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              Available Dashboards
            </label>
            <div className="space-y-2">
              {dashboards.map((dashboard) => (
                <div
                  key={dashboard.id}
                  className={`p-3 border rounded-lg cursor-pointer transition-all ${
                    selectedDashboard === dashboard.id
                      ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-500 ring-opacity-20'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                  onClick={() => setSelectedDashboard(dashboard.id)}
                >
                  <div className="flex items-start space-x-3">
                    <span className="text-2xl">{dashboard.icon}</span>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-gray-900">
                        {dashboard.name}
                      </h4>
                      <p className="text-xs text-gray-600 mt-1">
                        {dashboard.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Generate New Dashboard */}
          <div className="pt-4 border-t border-gray-200">
            <button
              onClick={() => setShowGenerateModal(true)}
              className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              🚀 Generate New Dashboard
            </button>
          </div>

        </div>
      </div>

      {/* Dashboard Content */}
      <div className="flex-1 bg-gradient-to-br from-gray-50 to-white overflow-y-auto">
        <div className="p-6">
          {/* Dashboard Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {dashboards.find(d => d.id === selectedDashboard)?.name}
                </h1>
                <p className="text-gray-600 mt-1">
                  {dashboards.find(d => d.id === selectedDashboard)?.description}
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <div className="px-3 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                  LIVE DATA
                </div>

                {/* Date Filter Dropdown */}
                <div className="relative date-picker-container">
                  <button
                    onClick={() => setShowDatePicker(!showDatePicker)}
                    className="px-4 py-2 text-sm bg-white hover:bg-gray-50 text-gray-700 rounded-lg border border-gray-200 transition-colors shadow-sm flex items-center space-x-2"
                  >
                    <span>📅</span>
                    <span>{currentDateRange.label}</span>
                    <svg className={`w-4 h-4 transition-transform ${showDatePicker ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {showDatePicker && (
                    <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-gray-200 rounded-xl shadow-lg z-50 p-4">
                      <div className="space-y-4">
                        <div>
                          <h4 className="text-sm font-semibold text-gray-900 mb-3">Filter by Date Range</h4>
                          <div className="space-y-2">
                            {dateFilterOptions.map((option) => (
                              <button
                                key={option.id}
                                onClick={() => {
                                  setSelectedDateFilter(option.id);
                                  if (option.id !== 'custom') {
                                    setShowDatePicker(false);
                                  }
                                }}
                                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                                  selectedDateFilter === option.id
                                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                    : 'hover:bg-gray-50 text-gray-700'
                                }`}
                              >
                                {option.label}
                                {option.days && (
                                  <span className="text-xs text-gray-500 ml-2">
                                    ({new Date(new Date().setDate(new Date().getDate() - option.days)).toLocaleDateString()} - {new Date().toLocaleDateString()})
                                  </span>
                                )}
                              </button>
                            ))}
                          </div>
                        </div>

                        {selectedDateFilter === 'custom' && (
                          <div className="border-t border-gray-200 pt-4">
                            <h5 className="text-sm font-medium text-gray-900 mb-3">Custom Date Range</h5>
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block text-xs text-gray-600 mb-1">From</label>
                                <input
                                  type="date"
                                  value={customDateRange.start.toISOString().split('T')[0]}
                                  onChange={(e) => setCustomDateRange({
                                    ...customDateRange,
                                    start: new Date(e.target.value)
                                  })}
                                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                              </div>
                              <div>
                                <label className="block text-xs text-gray-600 mb-1">To</label>
                                <input
                                  type="date"
                                  value={customDateRange.end.toISOString().split('T')[0]}
                                  onChange={(e) => setCustomDateRange({
                                    ...customDateRange,
                                    end: new Date(e.target.value)
                                  })}
                                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                              </div>
                            </div>
                            <div className="flex justify-end mt-3">
                              <button
                                onClick={() => setShowDatePicker(false)}
                                className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                              >
                                Apply Range
                              </button>
                            </div>
                          </div>
                        )}

                        <div className="border-t border-gray-200 pt-3 flex items-center justify-between text-xs text-gray-500">
                          <span>Showing data from {currentDateRange.start.toLocaleDateString()} to {currentDateRange.end.toLocaleDateString()}</span>
                          <button
                            onClick={() => setShowDatePicker(false)}
                            className="text-gray-400 hover:text-gray-600"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <button className="px-4 py-2 text-sm bg-white hover:bg-gray-50 text-gray-700 rounded-lg border border-gray-200 transition-colors shadow-sm">
                  🔄 Refresh
                </button>
                <button className="px-4 py-2 text-sm bg-white hover:bg-gray-50 text-gray-700 rounded-lg border border-gray-200 transition-colors shadow-sm">
                  📊 Export
                </button>
              </div>
            </div>
            <div className="text-sm text-gray-500">
              Last updated: {new Date().toLocaleString()} • Auto-refresh: Every 5 minutes
            </div>
          </div>

          {/* Date Filter Indicator */}
          {selectedDateFilter !== 'last30days' && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
              <div className="flex items-center space-x-2">
                <span className="text-blue-600">🔍</span>
                <div>
                  <h4 className="text-sm font-semibold text-blue-900">Filtered View Active</h4>
                  <p className="text-sm text-blue-700">
                    Showing data for {currentDateRange.label} ({currentDateRange.start.toLocaleDateString()} - {currentDateRange.end.toLocaleDateString()})
                  </p>
                </div>
                <button
                  onClick={() => setSelectedDateFilter('last30days')}
                  className="ml-auto px-3 py-1 text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-colors"
                >
                  Clear Filter
                </button>
              </div>
            </div>
          )}

          {/* Dashboard Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Sales Overview - Line Chart (filtered) */}
            <div>
              <ChartComponent chart={filterChartData(dashboardCharts[0])} width={450} height={350} />
            </div>

            {/* Market Share - Pie Chart */}
            <div>
              <ChartComponent chart={dashboardCharts[1]} width={450} height={350} />
            </div>

            {/* Regional Performance - Bar Chart */}
            <div>
              <ChartComponent chart={dashboardCharts[2]} width={450} height={300} />
            </div>

            {/* Customer Segments - Scatter Plot */}
            <div>
              <ChartComponent chart={dashboardCharts[3]} width={450} height={300} />
            </div>

            {/* Inventory Heatmap - spans full width */}
            <div className="lg:col-span-2">
              <ChartComponent chart={dashboardCharts[4]} width={920} height={250} />
            </div>
          </div>

          {/* Dashboard Insights */}
          <div className="mt-8 bg-white border border-gray-200 rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">🤖 AI-Generated Insights</h3>
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                Based on {currentDateRange.label}
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredInsights.map((insight, index) => (
                <div key={index} className={`border rounded-lg p-4 ${
                  insight.color === 'green' ? 'bg-green-50 border-green-200' :
                  insight.color === 'blue' ? 'bg-blue-50 border-blue-200' :
                  insight.color === 'yellow' ? 'bg-yellow-50 border-yellow-200' :
                  insight.color === 'purple' ? 'bg-purple-50 border-purple-200' :
                  'bg-gray-50 border-gray-200'
                }`}>
                  <div className="flex items-start space-x-2">
                    <span className={`mt-1 ${
                      insight.color === 'green' ? 'text-green-500' :
                      insight.color === 'blue' ? 'text-blue-500' :
                      insight.color === 'yellow' ? 'text-yellow-500' :
                      insight.color === 'purple' ? 'text-purple-500' :
                      'text-gray-500'
                    }`}>
                      {insight.icon}
                    </span>
                    <div>
                      <h4 className={`text-sm font-semibold ${
                        insight.color === 'green' ? 'text-green-900' :
                        insight.color === 'blue' ? 'text-blue-900' :
                        insight.color === 'yellow' ? 'text-yellow-900' :
                        insight.color === 'purple' ? 'text-purple-900' :
                        'text-gray-900'
                      }`}>
                        {insight.title}
                      </h4>
                      <p className={`text-xs mt-1 ${
                        insight.color === 'green' ? 'text-green-700' :
                        insight.color === 'blue' ? 'text-blue-700' :
                        insight.color === 'yellow' ? 'text-yellow-700' :
                        insight.color === 'purple' ? 'text-purple-700' :
                        'text-gray-700'
                      }`}>
                        {insight.message}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Additional insights based on date range */}
            <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <span>💡</span>
                <span>
                  <strong>Pro Tip:</strong> {
                    Math.floor((currentDateRange.end.getTime() - currentDateRange.start.getTime()) / (1000 * 60 * 60 * 24)) <= 7
                      ? 'Use weekly views to spot daily patterns and optimize operational schedules.'
                      : Math.floor((currentDateRange.end.getTime() - currentDateRange.start.getTime()) / (1000 * 60 * 60 * 24)) <= 90
                      ? 'Monthly and quarterly views are perfect for spotting trends and planning inventory.'
                      : 'Long-term views reveal seasonal patterns and help with strategic planning.'
                  }
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Generate Dashboard Modal */}
      {showGenerateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">🚀 Generate New Dashboard</h2>
                <button
                  onClick={() => {
                    setShowGenerateModal(false);
                    setGenerateStep('source');
                    setSelectedDataSource('');
                    setUploadProgress(0);
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <p className="text-gray-600 mt-2">Create a custom dashboard by connecting your data source</p>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              {/* Step 1: Data Source Selection */}
              {generateStep === 'source' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Data Source</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {dataSources.map((source) => (
                        <div
                          key={source.id}
                          className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${
                            selectedDataSource === source.id
                              ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                          }`}
                          onClick={() => setSelectedDataSource(source.id)}
                        >
                          <div className="flex items-start space-x-3">
                            <span className="text-2xl">{source.icon}</span>
                            <div className="flex-1">
                              <h4 className="font-semibold text-gray-900">{source.name}</h4>
                              <p className="text-sm text-gray-600 mt-1">{source.description}</p>
                              <span className={`inline-block mt-2 px-2 py-1 text-xs rounded-full ${
                                source.type === 'upload' ? 'bg-green-100 text-green-700' :
                                source.type === 'integration' ? 'bg-blue-100 text-blue-700' :
                                source.type === 'database' ? 'bg-purple-100 text-purple-700' :
                                'bg-gray-100 text-gray-700'
                              }`}>
                                {source.type}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3">
                    <button
                      onClick={() => setShowGenerateModal(false)}
                      className="px-6 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        if (selectedDataSource === 'upload-csv') {
                          setGenerateStep('upload');
                        } else {
                          setGenerateStep('configure');
                        }
                      }}
                      disabled={!selectedDataSource}
                      className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Continue
                    </button>
                  </div>
                </div>
              )}

              {/* Step 2: File Upload */}
              {generateStep === 'upload' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Upload Your Dataset</h3>
                    <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center">
                      <div className="space-y-4">
                        <div className="w-16 h-16 mx-auto bg-blue-100 rounded-full flex items-center justify-center">
                          <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                          </svg>
                        </div>
                        <div>
                          <h4 className="text-lg font-semibold text-gray-900">Drop your CSV file here</h4>
                          <p className="text-gray-600">or click to browse files</p>
                        </div>
                        <button
                          onClick={handleFileUpload}
                          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                        >
                          Select File
                        </button>
                      </div>

                      {uploadProgress > 0 && (
                        <div className="mt-6">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-gray-600">Uploading...</span>
                            <span className="text-sm text-gray-600">{uploadProgress}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${uploadProgress}%` }}
                            ></div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3">
                    <button
                      onClick={() => setGenerateStep('source')}
                      className="px-6 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                    >
                      Back
                    </button>
                  </div>
                </div>
              )}

              {/* Step 3: Configure Dashboard */}
              {generateStep === 'configure' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Configure Your Dashboard</h3>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Dashboard Name</label>
                        <input
                          type="text"
                          value={dashboardConfig.name}
                          onChange={(e) => setDashboardConfig({...dashboardConfig, name: e.target.value})}
                          placeholder="Enter dashboard name..."
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                        <textarea
                          value={dashboardConfig.description}
                          onChange={(e) => setDashboardConfig({...dashboardConfig, description: e.target.value})}
                          placeholder="Describe your dashboard..."
                          rows={3}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">Dashboard Type</label>
                        <div className="space-y-3">
                          {dashboardTypes.map((type) => (
                            <div
                              key={type.id}
                              className={`p-4 border rounded-lg cursor-pointer transition-all ${
                                dashboardConfig.type === type.id
                                  ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                              }`}
                              onClick={() => setDashboardConfig({...dashboardConfig, type: type.id})}
                            >
                              <h4 className="font-semibold text-gray-900">{type.name}</h4>
                              <p className="text-sm text-gray-600 mt-1">{type.description}</p>
                              <div className="flex flex-wrap gap-2 mt-2">
                                {type.charts.map((chart, index) => (
                                  <span key={index} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                                    {chart}
                                  </span>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3">
                    <button
                      onClick={() => setGenerateStep(selectedDataSource === 'upload-csv' ? 'upload' : 'source')}
                      className="px-6 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                    >
                      Back
                    </button>
                    <button
                      onClick={handleGenerateDashboard}
                      disabled={!dashboardConfig.name.trim()}
                      className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Generate Dashboard
                    </button>
                  </div>
                </div>
              )}

              {/* Step 4: Generating */}
              {generateStep === 'generating' && (
                <div className="space-y-6 text-center py-8">
                  <div className="w-16 h-16 mx-auto bg-blue-100 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-blue-600 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Generating Your Dashboard</h3>
                    <p className="text-gray-600 mt-2">Our AI is analyzing your data and creating the perfect dashboard...</p>
                  </div>
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
                    <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
                    <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}