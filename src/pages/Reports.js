import React, { useState, useEffect } from 'react';
import { Table, Dropdown } from 'semantic-ui-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CSVLink } from 'react-csv'; // Import CSVLink from react-csv
import './Reports.css';

const Reports = () => {
  const location = useLocation(); // Use useLocation to access the state
  const navigate = useNavigate(); // Initialize useNavigate for navigation

  // Combined data from /unallocated and /todo with different allocation percentages
  const combinedEmployeeData = [
    { employee_id: 'E001', employee_name: 'Alice Johnson', email: 'alice.johnson@example.com', role: 'Frontend Developer', current_allocation: 0 },
    { employee_id: 'E002', employee_name: 'Bob Smith', email: 'bob.smith@example.com', role: 'Backend Developer', current_allocation: 70 },
    { employee_id: 'E003', employee_name: 'Charlie Brown', email: 'charlie.brown@example.com', role: 'Designer', current_allocation: 0 },
    { employee_id: 'E004', employee_name: 'Diana Prince', email: 'diana.prince@example.com', role: 'QA Engineer', current_allocation: 80 },
    { employee_id: 'E005', employee_name: 'Edward Norton', email: 'edward.norton@example.com', role: 'DevOps Engineer', current_allocation: 0 },
    { employee_id: 'E006', employee_name: 'Fiona Apple', email: 'fiona.apple@example.com', role: 'Project Manager', current_allocation: 10 },
  ];

  // State for managing the filter
  const [filter, setFilter] = useState('allocated'); // Default filter is "allocated"

  useEffect(() => {
    if (location.state && location.state.filter) {
      setFilter(location.state.filter); // Set the filter from state if available
    }
  }, [location.state]);

  // Function to handle filter change
  const handleFilterChange = (e, { value }) => {
    setFilter(value);
  };

  // Filtered data based on the selected filter
  const filteredData = combinedEmployeeData.filter((employee) =>
    filter === 'allocated' ? employee.current_allocation > 0 : employee.current_allocation === 0
  );

  // Function to handle row click to navigate to EmployeeDetails page
  const handleRowClick = (employee) => {
    navigate('/employee/' + employee.employee_id, { state: { employee: { ...employee, allocation: employee.current_allocation } } });
  };

  // Prepare data for CSV export
  const csvData = filteredData.map((employee) => ({
    'Employee ID': employee.employee_id,
    'Employee Name': employee.employee_name,
    Email: employee.email,
    Role: employee.role,
    'Current Allocation %': employee.current_allocation,
  }));

  return (
    <div className="reports-container">
      <h2 className="reports-header">Reports</h2>

      {/* Filter Dropdown */}
      <Dropdown
        placeholder="Filter by Allocation"
        fluid
        selection
        options={[
          { key: 'allocated', text: 'Allocated', value: 'allocated' },
          { key: 'benched', text: 'Benched', value: 'benched' },
        ]}
        value={filter}
        onChange={handleFilterChange}
        className="filter-dropdown"
      />

      {/* CSV Download Button */}
      <CSVLink 
        data={csvData} 
        filename={"employee-reports.csv"} 
        className="ui button primary" 
        style={{ margin: '20px 0' }} // Add margin for better spacing
      >
        Download CSV
      </CSVLink>

      {/* Employees Table */}
      <Table celled striped className="reports-employee-table">
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
          {filteredData.map((employee) => (
            <Table.Row key={employee.employee_id} onClick={() => handleRowClick(employee)}>
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

export default Reports;
