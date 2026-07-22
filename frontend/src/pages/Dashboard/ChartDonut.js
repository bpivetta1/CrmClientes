import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

const DonutChart = (props) => {
  const { title, value, data, color } = props;
  
  // Garante que os dados estejam no formato correto
  const processedData = Array.isArray(data) ? data : [{ name: title, value: value || 0 }];
  
  // Processa as cores corretamente
  const colors = Array.isArray(color) ? color : [color || '#01a19a'];

  const renderCustomLabel = ({ cx, cy }) => {
    return (
      <text x={cx} y={cy} fill="#1C2E36" textAnchor="middle" dominantBaseline="middle">
        <tspan x={cx} dy="-0.5em" fontSize="1.2em" fontWeight="bold">{title}</tspan>
        <tspan x={cx} dy="1.5em" fontSize="1.2em" fontWeight="bold">{`${value}%`}</tspan>
      </text>
    );
  };

  return (
    <div style={{ width: '100%', height: '300px' }}>
      <ResponsiveContainer>
        <PieChart>
          <Pie
            data={processedData}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={100}
            innerRadius={70}
            labelLine={false}
            strokeWidth={0}
            label={renderCustomLabel}
          >
            {processedData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={colors[index % colors.length]}
              />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default DonutChart;
