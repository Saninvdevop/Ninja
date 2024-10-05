import React, { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import 'chart.js/auto';
import { Input, Button } from 'semantic-ui-react';
import './LineChart.css'; // Ensure this file exists with necessary styles

const LineChart = () => {
  const [formData, setFormData] = useState({
    startDate: '',
    endDate: ''
  });
  const [minEndDate, setMinEndDate] = useState('');
  const [chartData, setChartData] = useState({
    labels: [], // Dates (Y-axis)
    datasets: [], // Number of people (X-axis)
  });
  const [allocationDetails, setAllocationDetails] = useState({
    allocated: 0,
    unallocated: 0,
    draft: 0,
    bench: 0,
    startDate: '',
    endDate: ''
  });

  // Function to fetch data from the API
  const fetchData = async (url) => {
    try {
      const response = await fetch(url);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`Error fetching data from ${url}:`, error);
      return {};
    }
  };

  // Function to fetch chart data
  const fetchChartData = async (startDate, endDate) => {
    const [allocated, unallocated, draft, bench] = await Promise.all([
      fetchData('http://localhost:8080/employees/allocatedLeader'),
      fetchData('http://localhost:8080/employees/unallocatedLeader'),
      fetchData('http://localhost:8080/employees/draftLeader'),
      fetchData('http://localhost:8080/employees/benchLeader'),
    ]);

    // Prepare the labels (Y-axis: Dates) and datasets (X-axis: Number of people)
    const labels = [
      new Date(allocated.StartDate).toLocaleDateString(), 
      new Date(unallocated.StartDate).toLocaleDateString(), 
      new Date(draft.StartDate).toLocaleDateString(), 
      new Date(bench.StartDate).toLocaleDateString()
    ]; // Format the dates

    setChartData({
      labels,
      datasets: [
        {
          label: 'Allocated',
          data: [allocated.AllocatedCount], // X-axis: Number of allocated people
          borderColor: 'rgba(75,192,192,1)',
          backgroundColor: 'rgba(75,192,192,0.2)',
          fill: true,
        },
        {
          label: 'Unallocated',
          data: [unallocated.UnallocatedCount], // X-axis: Number of unallocated people
          borderColor: 'rgba(255,99,132,1)',
          backgroundColor: 'rgba(255,99,132,0.2)',
          fill: true,
        },
        {
          label: 'Draft',
          data: [draft.DraftCount], // X-axis: Number of draft people
          borderColor: 'rgba(54,162,235,1)',
          backgroundColor: 'rgba(54,162,235,0.2)',
          fill: true,
        },
        {
          label: 'Bench',
          data: [bench.BenchCount], // X-axis: Number of bench people
          borderColor: 'rgba(153,102,255,1)',
          backgroundColor: 'rgba(153,102,255,0.2)',
          fill: true,
        },
      ],
    });

    // Combine allocation details for overall details
    const earliestStartDate = Math.min(
      new Date(allocated.StartDate),
      new Date(unallocated.StartDate),
      new Date(draft.StartDate),
      new Date(bench.StartDate)
    );
    const latestEndDate = Math.max(
      new Date(allocated.EndDate),
      new Date(unallocated.EndDate),
      new Date(draft.EndDate),
      new Date(bench.EndDate)
    );

    setAllocationDetails({
      allocated: allocated.AllocatedCount,
      unallocated: unallocated.UnallocatedCount,
      draft: draft.DraftCount,
      bench: bench.BenchCount,
      startDate: new Date(earliestStartDate).toLocaleDateString(),
      endDate: new Date(latestEndDate).toLocaleDateString(),
    });
  };

  useEffect(() => {
    // Fetch entire chart data by default (for all available data)
    fetchChartData();
  }, []);

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

    if (name === 'endDate' && value) {
      fetchChartData(formData.startDate, value);
    }
  };

  const handleClear = () => {
    // Reset form data to empty strings and fetch overall data
    setFormData({
      startDate: '',
      endDate: ''
    });

    fetchChartData();
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
        -
        <Input
          type="date"
          name="endDate"
          value={formData.endDate}
          onChange={handleChange}
          min={minEndDate}
          placeholder="End Date"
          style={{ marginLeft: '10px', marginRight: '10px' }}
          aria-label="End Date"
        />
        <Button onClick={handleClear} primary>Clear</Button>
      </div>
      <div className="chart-container">
        <Line data={chartData} />
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
