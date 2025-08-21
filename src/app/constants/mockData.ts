export const demoDataList = {
  'pie': {
    csv: `category,value
Technology,35
Healthcare,25
Finance,20
Retail,12
Other,8`,
    input: 'create a pie chart showing the distribution of categories'
  },
  'bar chart': {
    csv: `product,sales,region
Laptop,1200,North
Desktop,800,North
Tablet,600,North
Laptop,1400,South
Desktop,900,South
Tablet,750,South
Laptop,1100,East
Desktop,700,East
Tablet,650,East`,
    input: 'show sales by product across different regions as a bar chart'
  },
  'line chart': {
    csv: `month,revenue,expenses
Jan,5000,3500
Feb,5500,3800
Mar,6200,4100
Apr,5800,3900
May,6800,4300
Jun,7200,4600
Jul,7800,4900
Aug,7500,4700
Sep,8100,5000
Oct,8600,5200
Nov,9200,5400
Dec,10000,5800`,
    input: 'create a line chart showing monthly revenue and expenses trends'
  },
  'scatter plot': {
    csv: `experience,salary,department
1,45000,Engineering
2,52000,Engineering
3,58000,Engineering
4,65000,Engineering
5,72000,Engineering
1,42000,Marketing
2,48000,Marketing
3,54000,Marketing
4,60000,Marketing
5,67000,Marketing
1,40000,Sales
2,46000,Sales
3,52000,Sales
4,58000,Sales
5,65000,Sales`,
    input: 'show the relationship between experience and salary by department'
  },
  'area chart': {
    csv: `quarter,Q1_2023,Q2_2023,Q3_2023,Q4_2023
Revenue,250000,280000,320000,380000
Profit,45000,52000,68000,85000`,
    input: 'create an area chart showing quarterly revenue and profit growth'
  },
  'dynamic bar': {
    csv: `country,continent,GDP,year
USA,America,23932,2020
China,Asia,14723,2020
Japan,Asia,4940,2020
Germany,Europe,3846,2020
India,Asia,3386,2020
UK,Europe,2831,2020
France,Europe,2716,2020
Italy,Europe,2107,2020
Brazil,America,1869,2020
Canada,America,1988,2020
USA,America,25463,2021
China,Asia,17734,2021
Japan,Asia,4238,2021
Germany,Europe,4260,2021
India,Asia,3737,2021
UK,Europe,3131,2021
France,Europe,2938,2021
Italy,Europe,2110,2021
Brazil,America,2055,2021
Canada,America,2139,2021`,
    input: 'show me the changes in GDP rankings of different countries'
  },
  'radar chart': {
    csv: `skill,John,Sarah,Mike
Programming,8,9,7
Design,6,8,5
Communication,7,9,8
Leadership,5,7,9
Problem Solving,9,8,7
Teamwork,8,9,6`,
    input: 'create a radar chart comparing skills across team members'
  },
  'heatmap': {
    csv: `hour,Monday,Tuesday,Wednesday,Thursday,Friday
9,45,52,48,51,49
10,62,68,65,70,66
11,78,85,82,88,84
12,92,98,95,102,96
13,88,94,91,97,93
14,76,82,79,85,81
15,65,71,68,74,70
16,54,60,57,63,59
17,43,49,46,52,48`,
    input: 'show website traffic patterns by hour and day as a heatmap'
  }
};

export const demoDataKeys = Object.keys(demoDataList) as Array<keyof typeof demoDataList>;