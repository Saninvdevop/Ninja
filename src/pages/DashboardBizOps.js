// src/pages/DashboardBizOps.js
import React from 'react';
import { Card, Table, Segment, Icon } from 'semantic-ui-react';
import { useNavigate } from 'react-router-dom'; // Import useNavigate for navigation
import './DashboardBizOps.css'; // Import CSS for consistent styling

const DashboardBizOps = () => {
  const navigate = useNavigate(); // Initialize useNavigate for navigation

  // Hardcoded data for the cards
  const unallocated = 20;
  const draft = 30;
  const activeProjects = 80;

  // Hardcoded data for the table
  const employeeData = [
    { employee_id: 'E001', employee_name: 'Alice Johnson', email: 'alice.johnson@example.com', current_allocation: 50 },
    { employee_id: 'E002', employee_name: 'Bob Smith', email: 'bob.smith@example.com', current_allocation: 70 },
    { employee_id: 'E003', employee_name: 'Charlie Brown', email: 'charlie.brown@example.com', current_allocation: 60 },
    { employee_id: 'E004', employee_name: 'Diana Prince', email: 'diana.prince@example.com', current_allocation: 80 },
    { employee_id: 'E005', employee_name: 'Edward Norton', email: 'edward.norton@example.com', current_allocation: 90 },
    { employee_id: 'E006', employee_name: 'Fiona Apple', email: 'fiona.apple@example.com', current_allocation: 40 },
  ];

  // Function to navigate to Unallocated page
  const handleUnallocatedClick = () => {
    navigate('/unallocated');
  };

  return (
    <div className="dashboard-bizops-container">
      <Segment className="content-wrapper">
        {/* Personalized Greeting and Message */}
        <div className="greeting-section">
          <h2 className='bizopname'>Hello Ravi,</h2>
          <p className="instruction-message">Pick where you left from </p>
        </div>

        {/* Cards Section */}
        <Card.Group itemsPerRow={3} className="bizops-cards">
          <Card className="interactive-card" onClick={handleUnallocatedClick}>
            <Card.Content>
              <Icon name="users" className="card-icon" />
              <Card.Header className="card-heading">Unallocated</Card.Header>
              <Card.Description className="card-value">{unallocated}</Card.Description>
            </Card.Content>
          </Card>
          <Card className="interactive-card">
            <Card.Content>
              <Icon name="edit" className="card-icon" />
              <Card.Header className="card-heading">Draft</Card.Header>
              <Card.Description className="card-value1">{draft}</Card.Description>
            </Card.Content>
          </Card>
          <Card className="interactive-card">
            <Card.Content>
              <Icon name="briefcase" className="card-icon" />
              <Card.Header className="card-heading">Active Projects</Card.Header>
              <Card.Description className="card-value2">{activeProjects}</Card.Description>
            </Card.Content>
          </Card>
        </Card.Group>

        {/* Table Section */}
        <h1 className='drafts'>Drafts</h1>
        <Table celled striped className="employee-table">
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>Employee ID</Table.HeaderCell>
              <Table.HeaderCell>Employee Name</Table.HeaderCell>
              <Table.HeaderCell>Email</Table.HeaderCell>
              <Table.HeaderCell>Current Allocation %</Table.HeaderCell>
            </Table.Row>
          </Table.Header>

          <Table.Body>
            {employeeData.map((employee) => (
              <Table.Row key={employee.employee_id}>
                <Table.Cell>{employee.employee_id}</Table.Cell>
                <Table.Cell>{employee.employee_name}</Table.Cell>
                <Table.Cell>{employee.email}</Table.Cell>
                <Table.Cell>{employee.current_allocation}%</Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
      </Segment>
    </div>
  );
};

export default DashboardBizOps;
