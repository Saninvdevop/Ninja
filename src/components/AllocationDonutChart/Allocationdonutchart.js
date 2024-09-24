import React from 'react';
import { Doughnut } from 'react-chartjs-2';
import { Chart, ArcElement, Tooltip, Legend } from 'chart.js';

Chart.register(ArcElement, Tooltip, Legend);

const AllocationDonutChart = ({ total, stagedTotal, dataValues, labels, colors }) => {
  const data = {
    labels: labels,
    datasets: [
      {
        label: 'Allocations',
        data: dataValues, // Dynamic data values
        backgroundColor: colors, // Use dynamic colors
        hoverOffset: 4,
      },
    ],
  };

  const options = {
    plugins: {
      legend: {
        display: false, // Disable legends
      },
      tooltip: {
        callbacks: {
          label: function (tooltipItem) {
            return tooltipItem.label + ': ' + tooltipItem.raw + '% Allocation';
          },
        },
      },
    },
    cutout: '70%', // Cutout to show the total value in the center
    maintainAspectRatio: false, // Prevent the chart from being distorted
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '300px' }}>
      {/* Donut Chart */}
      <div style={{ position: 'relative', width: '300px', height: '300px' }}>
        <Doughnut data={data} options={options} />
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
          }}
        >
          <h2 style={{ margin: 0, fontSize: 30, fontWeight: 'bold' }}>{total }%</h2>
          <p style={{ margin: 0, fontSize: 12, fontWeight: 500 }}>Allocated</p>
        </div>
      </div>
    </div>
  );
};

export default AllocationDonutChart;
