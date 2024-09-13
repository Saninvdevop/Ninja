import React from 'react';
import { Icon } from 'semantic-ui-react';
import { useNavigate } from 'react-router-dom'; // Import useNavigate
import './Dashboard.css';

const Dashboard = () => {
  const totalEmployees = 120;
  const totalProjects = 45;
  const activeProjects = 15;

  const navigate = useNavigate(); // Initialize useNavigate

  // Function to navigate to the Reports page with a filter
  const handleReportClick = (filter) => {
    navigate('/reports', { state: { filter } }); // Navigate to /reports with filter in state
  };

  // Function to navigate to the Projects page
  const handleProjectsClick = () => {
    navigate('/projects'); // Navigate to /projects
  };

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
       

        {/* Bench Report Card */}
        <div className="dashboard-card" onClick={() => handleReportClick('benched')}> {/* Navigate with 'benched' filter */}
          <div className="dashboard-card-content">
            <div className="dashboard-card-header">
              <Icon name='book' style={{ marginRight: '8px' }} />
              Bench Report
            </div>
            {/* Large Icon for Bench Report */}
            <div className="dashboard-card-icon-large">
              <Icon name='book' size='massive' />
            </div>
          </div>
        </div>

        {/* Allocated Report Card */}
        <div className="dashboard-card" onClick={() => handleReportClick('allocated')}> {/* Navigate with 'allocated' filter */}
          <div className="dashboard-card-content">
            <div className="dashboard-card-header">
              <Icon name='book outline' style={{ marginRight: '8px' }} />
              Allocated Report
            </div>
            {/* Two Icons for Allocated Report */}
            <div className="dashboard-card-icon-large">
              <Icon name='book' size='massive' />
              <Icon name='book outline' size='massive' style={{ marginLeft: '20px' }} />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;
