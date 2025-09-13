// Sample automotive data for scatter plot demonstration
const data = [
  { name: 'chevrolet chevelle malibu', milesPerGallon: 18, cylinders: 8, horsepower: 130 },
  { name: 'buick skylark 320', milesPerGallon: 15, cylinders: 8, horsepower: 165 },
  { name: 'plymouth satellite', milesPerGallon: 18, cylinders: 8, horsepower: 150 },
  { name: 'amc rebel sst', milesPerGallon: 16, cylinders: 8, horsepower: 150 },
  { name: 'ford torino', milesPerGallon: 17, cylinders: 8, horsepower: 140 },
  { name: 'datsun b210 gx', milesPerGallon: 39.4, cylinders: 4, horsepower: 70 },
  { name: 'honda civic cvcc', milesPerGallon: 36.1, cylinders: 4, horsepower: 60 },
  { name: 'oldsmobile cutlass salon brougham', milesPerGallon: 19.9, cylinders: 8, horsepower: 110 },
  { name: 'dodge diplomat', milesPerGallon: 19.4, cylinders: 8, horsepower: 140 },
  { name: 'mercury monarch ghia', milesPerGallon: 20.2, cylinders: 8, horsepower: 139 },
  { name: 'chevrolet cavalier', milesPerGallon: 28, cylinders: 4, horsepower: 88 },
  { name: 'chevrolet cavalier wagon', milesPerGallon: 27, cylinders: 4, horsepower: 88 },
  { name: 'chevrolet cavalier 2-door', milesPerGallon: 34, cylinders: 4, horsepower: 88 },
  { name: 'pontiac j2000 se hatchback', milesPerGallon: 31, cylinders: 4, horsepower: 85 },
  { name: 'dodge aries se', milesPerGallon: 29, cylinders: 4, horsepower: 84 },
  { name: 'pontiac phoenix', milesPerGallon: 27, cylinders: 4, horsepower: 90 },
  { name: 'ford fairmont futura', milesPerGallon: 24, cylinders: 4, horsepower: 92 },
  { name: 'amc concord dl', milesPerGallon: 23, cylinders: 4, horsepower: 78 },
  { name: 'volkswagen rabbit l', milesPerGallon: 36, cylinders: 4, horsepower: 74 },
  { name: 'mazda glc custom l', milesPerGallon: 37, cylinders: 4, horsepower: 68 }
];

// VChart specification for scatter plot
export const spec = {
  type: 'common',
  series: [
    {
      type: 'scatter',
      xField: 'milesPerGallon',
      yField: 'horsepower',
      point: {
        state: {
          hover: {
            scaleX: 1.2,
            scaleY: 1.2
          }
        },
        style: {
          fillOpacity: 0.7,
          fill: '#3b82f6'
        }
      }
    }
  ],
  tooltip: {
    dimension: {
      visible: true
    },
    mark: {
      title: true,
      content: [
        {
          key: 'Car Model',
          value: (d: any) => d.name
        },
        {
          key: 'Miles per Gallon',
          value: (d: any) => d.milesPerGallon
        },
        {
          key: 'Horsepower',
          value: (d: any) => d.horsepower
        }
      ]
    }
  },
  crosshair: {
    yField: {
      visible: true,
      line: {
        visible: true,
        type: 'line'
      },
      label: {
        visible: true
      }
    },
    xField: {
      visible: true,
      line: {
        visible: true,
        type: 'line'
      },
      label: {
        visible: true
      }
    }
  },
  axes: [
    {
      title: {
        visible: true,
        text: 'Horsepower'
      },
      orient: 'left',
      range: { min: 0 },
      type: 'linear'
    },
    {
      title: {
        visible: true,
        text: 'Miles per Gallon'
      },
      orient: 'bottom',
      label: { visible: true },
      type: 'linear'
    }
  ],
  data: [
    {
      id: 'data',
      values: data
    }
  ]
};

// Export formatted code string for blog display
export const codeString = `const data = ${JSON.stringify(data.slice(0, 5), null, 2)};
// ... more data points

const spec = ${JSON.stringify({
  type: 'common',
  series: [{
    type: 'scatter',
    xField: 'milesPerGallon',
    yField: 'horsepower',
    point: {
      style: { fillOpacity: 0.7, fill: '#3b82f6' }
    }
  }],
  axes: [
    { title: { text: 'Horsepower' }, orient: 'left' },
    { title: { text: 'Miles per Gallon' }, orient: 'bottom' }
  ],
  data: [{ id: 'data', values: data }]
}, null, 2)};`;