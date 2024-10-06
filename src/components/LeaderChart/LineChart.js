import React, { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import 'chart.js/auto'; // Ensure auto-import of necessary components
import 'chartjs-adapter-date-fns'; // Import date adapter
import { Input, Button } from 'semantic-ui-react';
import './LineChart.css'; // Ensure this file exists with necessary styles

const LineChart = () => {
  const [formData, setFormData] = useState({
    startDate: '',
    endDate: ''
  });
  const [minEndDate, setMinEndDate] = useState('');
  const [chartData, setChartData] = useState({
    labels: [], // Dates (X-axis)
    datasets: [], // Number of people (Y-axis)
  });
  const [allocationDetails, setAllocationDetails] = useState({
    allocated: 0,
    unallocated: 0,
    draft: 0,
    bench: 0,
  });

  // Function to fetch data from the API
  const fetchData = async (url) => {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`Error fetching data from ${url}:`, error);
      return {};
    }
  };

  // Function to fetch allocation snapshot for a specific date
  const fetchAllocationSnapshot = async (date) => {
    const url = `http://localhost:8080/api/allocation-snapshot?date=${date}`;
    const result = await fetchData(url);

    if (result) {
      setChartData({
        labels: [date], // X-axis: Single date for the snapshot
        datasets: [
          {
            label: 'Allocated',
            data: [result.allocated], // Y-axis: Number of allocated people
            borderColor: 'rgba(75,192,192,1)',
            backgroundColor: 'rgba(75,192,192,0.2)',
            fill: true,
          },
          {
            label: 'Unallocated',
            data: [result.unallocated], // Y-axis: Number of unallocated people
            borderColor: 'rgba(255,99,132,1)',
            backgroundColor: 'rgba(255,99,132,0.2)',
            fill: true,
          },
          {
            label: 'Draft',
            data: [result.draft], // Y-axis: Number of draft people
            borderColor: 'rgba(54,162,235,1)',
            backgroundColor: 'rgba(54,162,235,0.2)',
            fill: true,
          },
          {
            label: 'Bench',
            data: [result.bench], // Y-axis: Number of bench people
            borderColor: 'rgba(153,102,255,1)',
            backgroundColor: 'rgba(153,102,255,0.2)',
            fill: true,
          },
        ],
      });

      // Set allocation details
      setAllocationDetails({
        allocated: result.allocated,
        unallocated: result.unallocated,
        draft: result.draft,
        bench: result.bench,
      });
    }
  };

  useEffect(() => {
    // Fetch data for the selected date when component mounts or date changes
    if (formData.startDate) {
      fetchAllocationSnapshot(formData.startDate);
    }
  }, [formData.startDate]);

  const handleChange = (e, { name, value }) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    if (name === 'startDate') {
      setMinEndDate(value);
      setFormData(prev => ({
        ...prev,
        endDate: '',
      }));
    }
  };

  const handleClear = () => {
    // Reset form data to empty strings
    setFormData({
      startDate: '',
      endDate: ''
    });
    setChartData({
      labels: [],
      datasets: [],
    });
    setAllocationDetails({
      allocated: 0,
      unallocated: 0,
      draft: 0,
      bench: 0,
    });
  };

  return (
    <div className="line-chart-container">
      <h2>Employee Allocation Overview</h2>
      <div className='filter-tabs'>
        <Input
          type="date"
          name="startDate"
          value={formData.startDate}
          onChange={handleChange}
          placeholder="Start Date"
          min="2018-01-01"
          max="2030-12-31"
          style={{ marginRight: '10px' }}
          aria-label="Start Date"
        />
        <Button onClick={handleClear} primary>Clear</Button>
      </div>
      <div className="chart-container">
        <Line 
          data={chartData} 
          options={{
            scales: {
              x: {
                type: 'category', // X-axis is category since we are displaying a single date
                title: {
                  display: true,
                  text: 'Date',
                },
              },
              y: {
                title: {
                  display: true,
                  text: 'Number of Employees',
                },
                ticks: {
                  beginAtZero: true,
                },
              },
            },
          }}
        />
        <div className="allocation-details">
          <h3>Allocation Details</h3>
          <p><strong>Allocated:</strong> {allocationDetails.allocated}</p>
          <p><strong>Unallocated:</strong> {allocationDetails.unallocated}</p>
          <p><strong>Draft:</strong> {allocationDetails.draft}</p>
          <p><strong>Bench:</strong> {allocationDetails.bench}</p>
        </div>
      </div>
    </div>
  );
};

export default LineChart;
