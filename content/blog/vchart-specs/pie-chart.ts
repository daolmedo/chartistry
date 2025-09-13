// Sample sales data for pie chart demonstration
const data = [
  { category: 'Product A', value: 45, description: 'Our flagship product' },
  { category: 'Product B', value: 30, description: 'Popular mid-range option' },
  { category: 'Product C', value: 25, description: 'Budget-friendly choice' },
  { category: 'Product D', value: 15, description: 'Premium offering' },
  { category: 'Product E', value: 10, description: 'Specialty item' }
];

// VChart specification for pie chart
export const spec = {
  type: 'pie',
  data: {
    values: data
  },
  categoryField: 'category',
  valueField: 'value',
  label: {
    visible: true,
    position: 'outside',
    formatMethod: (value: string, datum: any) => {
      const percent = ((datum.value / data.reduce((sum, d) => sum + d.value, 0)) * 100).toFixed(1);
      return `${value}\n${percent}%`;
    }
  },
  legend: {
    visible: true,
    position: 'right',
    item: {
      label: {
        formatMethod: (value: string, datum: any) => {
          return `${value} (${datum.value})`;
        }
      }
    }
  },
  tooltip: {
    mark: {
      content: [
        {
          key: 'Category',
          value: (datum: any) => datum.category
        },
        {
          key: 'Value',
          value: (datum: any) => datum.value
        },
        {
          key: 'Percentage',
          value: (datum: any) => {
            const total = data.reduce((sum, d) => sum + d.value, 0);
            return `${((datum.value / total) * 100).toFixed(1)}%`;
          }
        }
      ]
    }
  },
  color: ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd'],
  radius: 0.8
};

// Export formatted code string for blog display
export const codeString = `const data = ${JSON.stringify(data, null, 2)};

const spec = ${JSON.stringify({
  type: 'pie',
  data: { values: data },
  categoryField: 'category',
  valueField: 'value',
  label: { visible: true, position: 'outside' },
  legend: { visible: true, position: 'right' },
  color: ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd']
}, null, 2)};`;