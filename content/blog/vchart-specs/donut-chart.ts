// Sample traffic source data for donut chart demonstration
const data = [
  { source: 'Direct', visits: 45000, percentage: 45 },
  { source: 'Search Engine', visits: 25000, percentage: 25 },
  { source: 'Social Media', visits: 15000, percentage: 15 },
  { source: 'Referral', visits: 10000, percentage: 10 },
  { source: 'Email', visits: 5000, percentage: 5 }
];

// VChart specification for donut chart
export const spec = {
  type: 'pie',
  data: {
    values: data
  },
  categoryField: 'source',
  valueField: 'visits',
  innerRadius: 0.5, // This creates the donut hole
  label: {
    visible: true,
    position: 'outside',
    formatMethod: (value: string, datum: any) => {
      return `${value}\n${datum.percentage}%`;
    }
  },
  legend: {
    visible: true,
    position: 'bottom',
    orient: 'horizontal',
    item: {
      label: {
        formatMethod: (value: string, datum: any) => {
          return `${value}: ${datum.visits.toLocaleString()}`;
        }
      }
    }
  },
  tooltip: {
    mark: {
      content: [
        {
          key: 'Traffic Source',
          value: (datum: any) => datum.source
        },
        {
          key: 'Visits',
          value: (datum: any) => datum.visits.toLocaleString()
        },
        {
          key: 'Percentage',
          value: (datum: any) => `${datum.percentage}%`
        }
      ]
    }
  },
  // Professional color scheme for traffic analytics
  color: ['#667eea', '#764ba2', '#f093fb', '#4facfe', '#00f2fe'],
  radius: 0.8,
  // Center text for total visits
  indicator: {
    visible: true,
    trigger: 'none',
    title: {
      style: {
        fontSize: 16,
        fontWeight: 'bold'
      },
      text: 'Total Visits'
    },
    content: {
      style: {
        fontSize: 20,
        fontWeight: 'bold',
        fill: '#333'
      },
      text: data.reduce((sum, d) => sum + d.visits, 0).toLocaleString()
    }
  }
};

// Export formatted code string for blog display
export const codeString = `const data = ${JSON.stringify(data, null, 2)};

const spec = ${JSON.stringify({
  type: 'pie',
  data: { values: data },
  categoryField: 'source',
  valueField: 'visits',
  innerRadius: 0.5, // Creates donut hole
  label: { visible: true, position: 'outside' },
  legend: { visible: true, position: 'bottom' },
  color: ['#667eea', '#764ba2', '#f093fb', '#4facfe', '#00f2fe']
}, null, 2)};`;