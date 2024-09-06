// src/pages/Unallocated.js
import React, { useState } from 'react';
import { Table, Input, Button, Icon } from 'semantic-ui-react';
import { useNavigate } from 'react-router-dom';
import './Unallocated.css'; // Import the CSS file for styling

const Unallocated = () => {
  const navigate = useNavigate();

  // Hardcoded data for the table
  const employeeData = [
    { employee_id: 'E001', employee_name: 'Alice Johnson', email: 'alice.johnson@example.com', role: 'Developer', current_allocation: 50 },
    { employee_id: 'E002', employee_name: 'Bob Smith', email: 'bob.smith@example.com', role: 'Designer', current_allocation: 70 },
    { employee_id: 'E003', employee_name: 'Charlie Brown', email: 'charlie.brown@example.com', role: 'Manager', current_allocation: 60 },
    { employee_id: 'E004', employee_name: 'Diana Prince', email: 'diana.prince@example.com', role: 'Tester', current_allocation: 80 },
    { employee_id: 'E005', employee_name: 'Edward Norton', email: 'edward.norton@example.com', role: 'Developer', current_allocation: 90 },
    { employee_id: 'E006', employee_name: 'Fiona Apple', email: 'fiona.apple@example.com', role: 'Support', current_allocation: 40 },
    { employee_id: 'E007', employee_name: 'George Clooney', email: 'george.clooney@example.com', role: 'Analyst', current_allocation: 30 },
    { employee_id: 'E008', employee_name: 'Hannah Montana', email: 'hannah.montana@example.com', role: 'Consultant', current_allocation: 60 },
    { employee_id: 'E009', employee_name: 'Ian McKellen', email: 'ian.mckellen@example.com', role: 'Architect', current_allocation: 70 },
    { employee_id: 'E010', employee_name: 'Jennifer Lopez', email: 'jennifer.lopez@example.com', role: 'HR', current_allocation: 50 },
  ];

  // State for search query and filtered data
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredData, setFilteredData] = useState(employeeData);

  // Handle search input change
  const handleSearchChange = (e) => {
    const query = e.target.value.toLowerCase();
    setSearchQuery(query);
    setFilteredData(
      employeeData.filter(
        (employee) =>
          employee.employee_name.toLowerCase().includes(query) ||
          employee.email.toLowerCase().includes(query) ||
          employee.role.toLowerCase().includes(query)
      )
    );
  };

  // Function to navigate to EmployeeDetails page
  const handleRowClick = (employee) => {
    navigate(`/employee/${employee.employee_id}`, { state: { employee } });
  };

  // Function to download data as CSV
  const downloadCSV = () => {
    const csvData = [
      ['Employee ID', 'Employee Name', 'Email', 'Role', 'Current Allocation %'],
      ...filteredData.map((employee) => [
        employee.employee_id,
        employee.employee_name,
        employee.email,
        employee.role,
        employee.current_allocation,
      ]),
    ];

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      csvData.map((row) => row.join(',')).join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'employee_data.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="unallocated-container">
      <h2 className="emp">Employees</h2>

      {/* Search Input and Download Button */}
      <div className="search-and-download">
        <Input
          icon="search"
          placeholder="Search employees..."
          value={searchQuery}
          onChange={handleSearchChange}
          className="search-input"
        />
        <Button color="blue" onClick={downloadCSV} className="download-button">
          <Icon name="download" /> Download CSV
        </Button>
      </div>

      {/* Employee Table */}
      <Table celled striped className="employee-table1">
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
            <Table.Row
              key={employee.employee_id}
              onClick={() => handleRowClick(employee)}
              style={{ cursor: 'pointer' }}
            >
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

export default Unallocated;
