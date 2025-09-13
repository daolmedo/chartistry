// Sample website activity heatmap data (hour vs day of week)
const data = [
  // Monday
  { day: 'Monday', hour: '00:00', visitors: 45, activity: 'Low' },
  { day: 'Monday', hour: '01:00', visitors: 32, activity: 'Low' },
  { day: 'Monday', hour: '02:00', visitors: 28, activity: 'Low' },
  { day: 'Monday', hour: '03:00', visitors: 22, activity: 'Low' },
  { day: 'Monday', hour: '04:00', visitors: 18, activity: 'Low' },
  { day: 'Monday', hour: '05:00', visitors: 25, activity: 'Low' },
  { day: 'Monday', hour: '06:00', visitors: 55, activity: 'Medium' },
  { day: 'Monday', hour: '07:00', visitors: 78, activity: 'Medium' },
  { day: 'Monday', hour: '08:00', visitors: 125, activity: 'High' },
  { day: 'Monday', hour: '09:00', visitors: 165, activity: 'High' },
  { day: 'Monday', hour: '10:00', visitors: 185, activity: 'High' },
  { day: 'Monday', hour: '11:00', visitors: 195, activity: 'High' },
  { day: 'Monday', hour: '12:00', visitors: 178, activity: 'High' },
  { day: 'Monday', hour: '13:00', visitors: 192, activity: 'High' },
  { day: 'Monday', hour: '14:00', visitors: 205, activity: 'High' },
  { day: 'Monday', hour: '15:00', visitors: 188, activity: 'High' },
  { day: 'Monday', hour: '16:00', visitors: 172, activity: 'High' },
  { day: 'Monday', hour: '17:00', visitors: 145, activity: 'High' },
  { day: 'Monday', hour: '18:00', visitors: 118, activity: 'Medium' },
  { day: 'Monday', hour: '19:00', visitors: 95, activity: 'Medium' },
  { day: 'Monday', hour: '20:00', visitors: 82, activity: 'Medium' },
  { day: 'Monday', hour: '21:00', visitors: 75, activity: 'Medium' },
  { day: 'Monday', hour: '22:00', visitors: 68, activity: 'Medium' },
  { day: 'Monday', hour: '23:00', visitors: 52, activity: 'Medium' },

  // Tuesday (similar pattern with slight variations)
  { day: 'Tuesday', hour: '00:00', visitors: 42, activity: 'Low' },
  { day: 'Tuesday', hour: '01:00', visitors: 35, activity: 'Low' },
  { day: 'Tuesday', hour: '08:00', visitors: 132, activity: 'High' },
  { day: 'Tuesday', hour: '09:00', visitors: 175, activity: 'High' },
  { day: 'Tuesday', hour: '10:00', visitors: 198, activity: 'High' },
  { day: 'Tuesday', hour: '14:00', visitors: 215, activity: 'High' },
  { day: 'Tuesday', hour: '15:00', visitors: 202, activity: 'High' },

  // Wednesday
  { day: 'Wednesday', hour: '09:00', visitors: 180, activity: 'High' },
  { day: 'Wednesday', hour: '10:00', visitors: 205, activity: 'High' },
  { day: 'Wednesday', hour: '14:00', visitors: 225, activity: 'High' },

  // Thursday  
  { day: 'Thursday', hour: '09:00', visitors: 172, activity: 'High' },
  { day: 'Thursday', hour: '14:00', visitors: 208, activity: 'High' },

  // Friday
  { day: 'Friday', hour: '09:00', visitors: 155, activity: 'High' },
  { day: 'Friday', hour: '14:00', visitors: 185, activity: 'High' },
  { day: 'Friday', hour: '17:00', visitors: 165, activity: 'High' },

  // Saturday (different pattern - more evening activity)
  { day: 'Saturday', hour: '10:00', visitors: 95, activity: 'Medium' },
  { day: 'Saturday', hour: '14:00', visitors: 135, activity: 'High' },
  { day: 'Saturday', hour: '19:00', visitors: 155, activity: 'High' },
  { day: 'Saturday', hour: '20:00', visitors: 142, activity: 'High' },

  // Sunday (weekend pattern)
  { day: 'Sunday', hour: '11:00', visitors: 88, activity: 'Medium' },
  { day: 'Sunday', hour: '14:00', visitors: 112, activity: 'Medium' },
  { day: 'Sunday', hour: '19:00', visitors: 125, activity: 'High' }
];

// VChart specification for heatmap
export const spec = {
  type: 'heatmap',
  data: {
    values: data
  },
  xField: 'hour',
  yField: 'day',
  valueField: 'visitors',
  cell: {
    style: {
      stroke: '#fff',
      strokeWidth: 2,
      cornerRadius: 2
    },
    state: {
      hover: {
        stroke: '#000',
        strokeWidth: 2
      }
    }
  },
  label: {
    visible: true,
    style: {
      fill: '#fff',
      fontSize: 10,
      fontWeight: 'bold'
    },
    formatMethod: (value: number) => {
      return value > 50 ? value.toString() : '';
    }
  },
  tooltip: {
    mark: {
      title: {
        value: (datum: any) => `${datum.day} at ${datum.hour}`
      },
      content: [
        {
          key: 'Visitors',
          value: (datum: any) => datum.visitors.toLocaleString()
        },
        {
          key: 'Activity Level',
          value: (datum: any) => datum.activity
        }
      ]
    }
  },
  axes: [
    {
      orient: 'bottom',
      type: 'band',
      title: {
        visible: true,
        text: 'Hour of Day'
      },
      label: {
        visible: true,
        formatMethod: (value: string) => {
          // Show only every 4th hour for cleaner display
          const hour = parseInt(value.split(':')[0]);
          return hour % 4 === 0 ? value : '';
        }
      }
    },
    {
      orient: 'left',
      type: 'band',
      title: {
        visible: true,
        text: 'Day of Week'
      },
      label: {
        visible: true
      }
    }
  ],
  legends: [
    {
      visible: true,
      position: 'right',
      type: 'color',
      title: {
        visible: true,
        text: 'Visitor Count'
      },
      field: 'visitors'
    }
  ],
  color: {
    type: 'linear',
    range: ['#ffffff', '#e3f2fd', '#90caf9', '#42a5f5', '#1976d2', '#0d47a1'],
    domain: [0, 250]
  }
};

// Export formatted code string for blog display
export const codeString = `const data = ${JSON.stringify(data.slice(0, 10), null, 2)};
// ... more hourly data for each day

const spec = ${JSON.stringify({
  type: 'heatmap',
  data: { values: data },
  xField: 'hour',
  yField: 'day', 
  valueField: 'visitors',
  label: { visible: true },
  color: {
    type: 'linear',
    range: ['#ffffff', '#e3f2fd', '#90caf9', '#42a5f5', '#1976d2'],
    domain: [0, 250]
  }
}, null, 2)};`;