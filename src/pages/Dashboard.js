// src/pages/Dashboard.js
import React from 'react';
import { Icon } from 'semantic-ui-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import './Dashboard.css';

const Dashboard = () => {
  const totalEmployees = 120;
  const totalProjects = 45;
  const activeProjects = 15;
  const totalRevenue = "$1,200,000";

  const pieData = [
    { name: 'Innovative Projects', value: 10 },
    { name: 'Bench', value: 5 },
    { name: 'Client Projects', value: 30 },
  ];

  const COLORS = ['#4a90e2', '#50e3c2', '#f5a623'];

  const barData = [
    { department: 'HR', count: 10 },
    { department: 'Engineering', count: 40 },
    { department: 'Marketing', count: 20 },
    { department: 'Sales', count: 15 },
    { department: 'Finance', count: 8 },
  ];

  return (
    <div className="dashboard-page-container">
      <div className="dashboard-card-group">
        {/* Employee Card */}
        <div className="dashboard-card">
          <Icon name='users' className='dashboard-card-icon' />
          <div className="dashboard-card-content">
            <div className="dashboard-card-header">
              <Icon name='users' style={{ marginRight: '8px' }} />
              Total Employees
            </div>
            <div className="dashboard-card-description">{totalEmployees}</div>
          </div>
        </div>

        {/* Project Card */}
        <div className="dashboard-card">
          <Icon name='folder open' className='dashboard-card-icon' />
          <div className="dashboard-card-content">
            <div className="dashboard-card-header">
              <Icon name='folder open' style={{ marginRight: '8px' }} />
              Total Projects
            </div>
            <div className="dashboard-card-description">{totalProjects}</div>
          </div>
        </div>

        {/* Active Projects Card */}
        <div className="dashboard-card">
          <Icon name='tasks' className='dashboard-card-icon' />
          <div className="dashboard-card-content">
            <div className="dashboard-card-header">
              <Icon name='tasks' style={{ marginRight: '8px' }} />
              Active Projects
            </div>
            <div className="dashboard-card-description">{activeProjects}</div>
          </div>
        </div>

        {/* Revenue Card */}
        <div className="dashboard-card">
          <Icon name='dollar' className='dashboard-card-icon' />
          <div className="dashboard-card-content">
            <div className="dashboard-card-header">
              <Icon name='dollar' style={{ marginRight: '8px' }} />
              Total Revenue Generated
            </div>
            <div className="dashboard-card-description">{totalRevenue}</div>
          </div>
        </div>

        {/* Pie Chart Card */}
        <div className="dashboard-card dashboard-pie-chart">
          <div className="dashboard-card-content">
            <div className="dashboard-card-header">Project Distribution</div>
            <div className="dashboard-chart-container">
              <PieChart width={300} height={200}>
                <Pie
                  data={pieData}
                  cx={150}
                  cy={100}
                  innerRadius={40}
                  outerRadius={80}
                  fill="#8884d8"
                  paddingAngle={5}
                  dataKey="value"
                  label
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </div>
          </div>
        </div>

        {/* Bar Chart Card */}
        <div className="dashboard-card dashboard-bar-chart">
          <div className="dashboard-card-content">
            <div className="dashboard-card-header">Department Distribution</div>
            <div className="dashboard-chart-container">
              <BarChart width={300} height={200} data={barData}>
                <XAxis dataKey="department" stroke="#666" />
                <YAxis stroke="#666" />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#4a90e2" />
              </BarChart>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
