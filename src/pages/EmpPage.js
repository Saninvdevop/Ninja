// src/pages/EmpPage.js

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, Input, Dropdown, Icon } from 'semantic-ui-react'; // Import Icon component for back arrow

const EmpPage = () => {
  const navigate = useNavigate(); // For navigation to employee details

  // Expanded employee data with more employees including those with 100% allocation
  const employeeData = [
    { employee_id: 'E001', employee_name: 'Alice Johnson', email: 'alice.johnson@example.com', current_allocation: 50 },
    { employee_id: 'E002', employee_name: 'Bob Smith', email: 'bob.smith@example.com', current_allocation: 30 },
    { employee_id: 'E003', employee_name: 'John Johnson', email: 'j.johnson@example.com', current_allocation: 20 },
    { employee_id: 'E004', employee_name: 'Peter Smith', email: 'p.smith@example.com', current_allocation: 30 },
    { employee_id: 'E005', employee_name: 'Sam Johnson', email: 's.johnson@example.com', current_allocation: 10 },
    { employee_id: 'E006', employee_name: 'Ron Smith', email: 'r.smith@example.com', current_allocation: 90 },
    { employee_id: 'E007', employee_name: 'Parker Johnson', email: 'p.johnson@example.com', current_allocation: 55 },
    { employee_id: 'E008', employee_name: 'Samuel Smith', email: 'sm.smith@example.com', current_allocation: 30 },
    { employee_id: 'E009', employee_name: 'Nina Brown', email: 'nina.brown@example.com', current_allocation: 70 },
    { employee_id: 'E010', employee_name: 'Oliver Twist', email: 'oliver.twist@example.com', current_allocation: 100 },
    { employee_id: 'E011', employee_name: 'Lucas White', email: 'lucas.white@example.com', current_allocation: 100 },
    { employee_id: 'E012', employee_name: 'Sophia Green', email: 'sophia.green@example.com', current_allocation: 75 },
    { employee_id: 'E013', employee_name: 'Liam Black', email: 'liam.black@example.com', current_allocation: 85 },
    { employee_id: 'E014', employee_name: 'Emma Blue', email: 'emma.blue@example.com', current_allocation: 100 },
    { employee_id: 'E015', employee_name: 'Mason Gray', email: 'mason.gray@example.com', current_allocation: 45 },
    // More employees can be added here as needed
  ];

  const [searchTerm, setSearchTerm] = useState(''); // State for search term
  const [filteredEmployees, setFilteredEmployees] = useState(employeeData); // State for filtered employees
  const [filter, setFilter] = useState('all'); // State for filter option

  // Handle search input change
  const handleSearchChange = (e) => {
    const searchValue = e.target.value.toLowerCase();
    setSearchTerm(searchValue);
    applyFilters(searchValue, filter);
  };

  // Handle filter dropdown change
  const handleFilterChange = (e, { value }) => {
    setFilter(value);
    applyFilters(searchTerm, value);
  };

  // Apply search and filter logic
  const applyFilters = (searchTerm, filter) => {
    const filtered = employeeData.filter((employee) => {
      const matchesSearchTerm =
        employee.employee_name.toLowerCase().includes(searchTerm) ||
        employee.email.toLowerCase().includes(searchTerm) ||
        employee.employee_id.toLowerCase().includes(searchTerm);

      let matchesFilter = true;
      if (filter === 'bench') {
        matchesFilter = employee.current_allocation === 0;
      } else if (filter === 'draft') {
        matchesFilter = employee.current_allocation > 0 && employee.current_allocation < 100;
      } else if (filter === 'allocated') {
        matchesFilter = employee.current_allocation === 100;
      }

      return matchesSearchTerm && matchesFilter;
    });

    setFilteredEmployees(filtered);
  };

  // Handle navigation to individual employee details
  const handleEmployeeClick = (employee) => {
    navigate(`/employee/${employee.employee_id}`, {
      state: {
        employee,
        allocationPercentage: employee.current_allocation, // Pass the current allocation percentage
      },
    });
  };

  // Function to handle back navigation
  const handleBackClick = () => {
    navigate(-1); // Go back to the previous page
  };

  // Filter options for the dropdown
  const filterOptions = [
    { key: 'all', text: 'All', value: 'all' },
    { key: 'bench', text: 'Bench', value: 'bench' },
    { key: 'draft', text: 'Draft', value: 'draft' },
    { key: 'allocated', text: 'Allocated', value: 'allocated' },
  ];

  return (
    <div className="employee-details-container">
      {/* Back Arrow Icon */}
      <Icon name="arrow left" size="large" style={{ cursor: 'pointer', marginBottom: '20px' }} onClick={handleBackClick} />
      
      <h2>Employee Details</h2>

      {/* Search Bar */}
      <Input
        icon="search"
        placeholder="Search by name, email, or ID..."
        value={searchTerm}
        onChange={handleSearchChange}
        style={{ marginBottom: '20px' }}
      />

      {/* Filter Dropdown */}
      <Dropdown
        placeholder="Filter Employees"
        selection
        options={filterOptions}
        value={filter}
        onChange={handleFilterChange}
        style={{ marginBottom: '20px', marginLeft: '20px' }}
      />

      {/* Employee Table */}
      <Table celled striped>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell>Employee ID</Table.HeaderCell>
            <Table.HeaderCell>Employee Name</Table.HeaderCell>
            <Table.HeaderCell>Email</Table.HeaderCell>
            <Table.HeaderCell>Current Allocation %</Table.HeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {filteredEmployees.map((employee) => (
            <Table.Row key={employee.employee_id} onClick={() => handleEmployeeClick(employee)} style={{ cursor: 'pointer' }}>
              <Table.Cell>{employee.employee_id}</Table.Cell>
              <Table.Cell>{employee.employee_name}</Table.Cell>
              <Table.Cell>{employee.email}</Table.Cell>
              <Table.Cell>{employee.current_allocation}%</Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table>
    </div>
  );
};

export default EmpPage;
