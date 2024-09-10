// src/pages/ToDoPage.js

import React from 'react';
import { Table, Icon } from 'semantic-ui-react';
import { useNavigate } from 'react-router-dom'; // Import useNavigate for navigation
import './ToDoPage.css'; // Import CSS for consistent styling
import { useEffect, useState } from 'react';

const ToDoPage = () => {
  const navigate = useNavigate(); // Initialize useNavigate for navigation

  // Hardcoded data for the table with 0% allocation
  const [allocatedEmployees, setAllocatedEmployees] = useState([]);
  const [benchedEmployees, setBenchedEmployees] = useState([]);
  const [filter, setFilter] = useState('allocated'); // Default filter is "allocated"
  const [loading, setLoading] = useState(true); // Loading state

  // Fetch data from APIs
  useEffect(() => {
    const fetchEmployeeData = async () => {
      try {
        setLoading(true);
        const allocatedResponse = await fetch('http://localhost:5000/employees/drafts');
        const benchedResponse = await fetch('http://localhost:5000/employees/todo');
        
        if (!allocatedResponse.ok || !benchedResponse.ok) {
          throw new Error('Network response was not ok');
        }

        const allocatedData = await allocatedResponse.json();
        const benchedData = await benchedResponse.json();

        setAllocatedEmployees(allocatedData);
        setBenchedEmployees(benchedData);
      } catch (error) {
        console.error('Fetch error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEmployeeData();
  }, []);

  // Function to handle row click to navigate to EmployeeDetails page
  const handleRowClick = (employee) => {
    navigate('/employee/' + employee.EmployeeID, { state: { employee: { ...employee, allocation: 0 } } }); // Navigate with state
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
            {/* <Table.HeaderCell>Role</Table.HeaderCell> */}
            <Table.HeaderCell>Current Allocation %</Table.HeaderCell>
          </Table.Row>
        </Table.Header>

        <Table.Body>
          {benchedEmployees.map((employee) => (
            <Table.Row key={employee.EmployeeID} onClick={() => handleRowClick(employee)}> {/* Row click handler */}
              <Table.Cell>{employee.EmployeeID}</Table.Cell>
              <Table.Cell>{employee.EmployeeName}</Table.Cell>
              <Table.Cell>{employee.Email}</Table.Cell>
              {/* <Table.Cell>{employee.role}</Table.Cell> */}
              <Table.Cell>{employee.Allocation}%</Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table>
    </div>
  );
};

export default ToDoPage;
