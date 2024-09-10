// src/pages/ToDoPage.js

import React from 'react';
import { Table, Icon } from 'semantic-ui-react';
import { useNavigate } from 'react-router-dom'; // Import useNavigate for navigation
import './ToDoPage.css'; // Import CSS for consistent styling

const ToDoPage = () => {
  const navigate = useNavigate(); // Initialize useNavigate for navigation

  // Hardcoded data for the table with 0% allocation
  const employeeData = [
    { employee_id: 'E001', employee_name: 'Alice Johnson', email: 'alice.johnson@example.com', role: 'Frontend Developer', current_allocation: 0 },
    { employee_id: 'E002', employee_name: 'Bob Smith', email: 'bob.smith@example.com', role: 'Backend Developer', current_allocation: 0 },
    { employee_id: 'E003', employee_name: 'Charlie Brown', email: 'charlie.brown@example.com', role: 'Designer', current_allocation: 0 },
    { employee_id: 'E004', employee_name: 'Diana Prince', email: 'diana.prince@example.com', role: 'QA Engineer', current_allocation: 0 },
    { employee_id: 'E005', employee_name: 'Edward Norton', email: 'edward.norton@example.com', role: 'DevOps Engineer', current_allocation: 0 },
    { employee_id: 'E006', employee_name: 'Fiona Apple', email: 'fiona.apple@example.com', role: 'Project Manager', current_allocation: 0 },
  ];

  // Function to handle row click to navigate to EmployeeDetails page
  const handleRowClick = (employee) => {
    navigate('/employee/' + employee.employee_id, { state: { employee: { ...employee, allocation: 0 } } }); // Navigate with state
  };

  // Function to handle back navigation
  const handleBackClick = () => {
    navigate(-1); // Go back to the previous page
  };

  return (
    <div className="todo-page-container">
      {/* Back Arrow Icon */}
      <Icon name="arrow left" size="large" style={{ cursor: 'pointer', marginBottom: '20px' }} onClick={handleBackClick} />
      
      <h2 className="todo-page-header">To Do - Employee Allocation</h2>
      <Table celled striped className="todo-employee-table">
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell>Employee ID</Table.HeaderCell>
            <Table.HeaderCell>Employee Name</Table.HeaderCell>
            <Table.HeaderCell>Email</Table.HeaderCell>
            <Table.HeaderCell>Role</Table.HeaderCell>
            <Table.HeaderCell>Current Allocation %</Table.HeaderCell>
          </Table.Row>
        </Table.Header>

        <Table.Body>
          {employeeData.map((employee) => (
            <Table.Row key={employee.employee_id} onClick={() => handleRowClick(employee)}> {/* Row click handler */}
              <Table.Cell>{employee.employee_id}</Table.Cell>
              <Table.Cell>{employee.employee_name}</Table.Cell>
              <Table.Cell>{employee.email}</Table.Cell>
              <Table.Cell>{employee.role}</Table.Cell>
              <Table.Cell>{employee.current_allocation}%</Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table>
    </div>
  );
};

export default ToDoPage;
