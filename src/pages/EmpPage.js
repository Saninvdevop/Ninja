// src/pages/EmpPage.js

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, Input, Dropdown, Icon } from 'semantic-ui-react'; // Import Icon component for back arrow

const EmpPage = () => {
  const navigate = useNavigate(); // For navigation to employee details

  // State for employee data and loading status
  const [employeeData, setEmployeeData] = useState([]);
  const [loading, setLoading] = useState(false);

  // State for search and filter
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [filter, setFilter] = useState('all');
  const[count,setCount]=useState();
  useEffect(() => {
    const fetchClientData = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://localhost:5000/employees');
        
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }

        const data = await response.json();
        setEmployeeData(data);
        setFilteredEmployees(data); // Initialize filtered employees
        setCount(data.length)
      } catch (error) {
        console.error('Fetch error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchClientData();
  }, []); // Empty dependency array to run once on component mount

  // Handle search input change
  const handleSearchChange = (e) => {
    const searchValue = e.target.value
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
    // Convert search term to lowercase
    const lowerSearchTerm = searchTerm.toLowerCase();
  
    const filtered = employeeData.filter((employee) => {
      // Convert employee properties to lowercase for comparison
      const employeeName = employee.EmployeeName.toLowerCase();
      const email = employee.Email.toLowerCase();
      const employeeId = (employee?.EmployeeID || '').toString().toLowerCase();;
  
      // Check if the employee matches the search term
      const matchesSearchTerm =
        employeeName.includes(lowerSearchTerm) ||
        email.includes(lowerSearchTerm) ||
        employeeId.includes(lowerSearchTerm);
  
      // Check if the employee matches the filter criteria
      let matchesFilter = true;
      if (filter === 'bench') {
        matchesFilter = employee.Allocation === 0;
      } else if (filter === 'draft') {
        matchesFilter = employee.current_allocation > 0 && employee.Allocation < 100;
      } else if (filter === 'allocated') {
        matchesFilter = employee.Allocation === 100;
      }
  
      // Return true if both search and filter criteria are met
      return matchesSearchTerm && matchesFilter;
    });
  
    // Log filtered results for debugging
    console.log('Filtered Employees:', filtered);
  
    setFilteredEmployees(filtered);
  };
  

  // Handle navigation to individual employee details
  const handleEmployeeClick = (employee) => {
    navigate(`/employee/${employee.EmployeeID}`, {
      state: {
        employee,
        allocationPercentage: employee.Allocation, // Pass the current allocation percentage
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
            <Table.Row key={employee.EmployeeID} onClick={() => handleEmployeeClick(employee)} style={{ cursor: 'pointer' }}>
              <Table.Cell>{employee.EmployeeID}</Table.Cell>
              <Table.Cell>{employee.EmployeeName}</Table.Cell>
              <Table.Cell>{employee.Email}</Table.Cell>
              <Table.Cell>{employee.Allocation}%</Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table>
    </div>
  );
};

export default EmpPage;
