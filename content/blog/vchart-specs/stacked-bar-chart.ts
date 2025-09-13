// Sample quarterly revenue data by product line
const data = [
  { quarter: 'Q1 2024', product: 'Software', revenue: 250000, category: 'Technology' },
  { quarter: 'Q1 2024', product: 'Hardware', revenue: 180000, category: 'Technology' },
  { quarter: 'Q1 2024', product: 'Services', revenue: 120000, category: 'Services' },
  { quarter: 'Q1 2024', product: 'Training', revenue: 80000, category: 'Services' },
  
  { quarter: 'Q2 2024', product: 'Software', revenue: 280000, category: 'Technology' },
  { quarter: 'Q2 2024', product: 'Hardware', revenue: 200000, category: 'Technology' },
  { quarter: 'Q2 2024', product: 'Services', revenue: 140000, category: 'Services' },
  { quarter: 'Q2 2024', product: 'Training', revenue: 95000, category: 'Services' },
  
  { quarter: 'Q3 2024', product: 'Software', revenue: 320000, category: 'Technology' },
  { quarter: 'Q3 2024', product: 'Hardware', revenue: 220000, category: 'Technology' },
  { quarter: 'Q3 2024', product: 'Services', revenue: 160000, category: 'Services' },
  { quarter: 'Q3 2024', product: 'Training', revenue: 110000, category: 'Services' },
  
  { quarter: 'Q4 2024', product: 'Software', revenue: 350000, category: 'Technology' },
  { quarter: 'Q4 2024', product: 'Hardware', revenue: 240000, category: 'Technology' },
  { quarter: 'Q4 2024', product: 'Services', revenue: 180000, category: 'Services' },
  { quarter: 'Q4 2024', product: 'Training', revenue: 125000, category: 'Services' }
];

// VChart specification for stacked bar chart
export const spec = {
  type: 'bar',
  data: {
    values: data
  },
  xField: 'quarter',
  yField: 'revenue',
  seriesField: 'product',
  stack: true,
  label: {
    visible: true,
    position: 'middle',
    formatMethod: (value: number) => {
      return value >= 100000 ? `$${(value / 1000)}K` : '';
    },
    style: {
      fill: 'white',
      fontWeight: 'bold',
      fontSize: 10
    }
  },
  tooltip: {
    mark: {
      title: {
        value: (datum: any) => `${datum.quarter} - ${datum.product}`
      },
      content: [
        {
          key: 'Revenue',
          value: (datum: any) => `$${datum.revenue.toLocaleString()}`
        },
        {
          key: 'Category',
          value: (datum: any) => datum.category
        }
      ]
    }
  },
  axes: [
    {
      orient: 'left',
      title: {
        visible: true,
        text: 'Revenue ($)'
      },
      label: {
        formatMethod: (value: number) => `$${(value / 1000)}K`
      }
    },
    {
      orient: 'bottom',
      title: {
        visible: true,
        text: 'Quarter'
      },
      label: {
        visible: true
      }
    }
  ],
  legends: [
    {
      visible: true,
      position: 'top',
      orient: 'horizontal',
      title: {
        visible: true,
        text: 'Product Lines'
      }
    }
  ],
  // Professional color scheme for business data
  color: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'],
  animation: {
    appear: {
      duration: 1000,
      easing: 'cubicOut'
    }
  }
};

// Export formatted code string for blog display
export const codeString = `const data = ${JSON.stringify(data.slice(0, 8), null, 2)};
// ... more quarterly data

const spec = ${JSON.stringify({
  type: 'bar',
  data: { values: data },
  xField: 'quarter',
  yField: 'revenue',
  seriesField: 'product',
  stack: true,
  label: { visible: true, position: 'middle' },
  axes: [
    { orient: 'left', title: { text: 'Revenue ($)' } },
    { orient: 'bottom', title: { text: 'Quarter' } }
  ],
  color: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444']
}, null, 2)};`;