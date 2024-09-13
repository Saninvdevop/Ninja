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
  const [count, setCount] = useState();

  useEffect(() => {
    fetchDataBasedOnFilter(filter);
  }, [filter]); // Re-fetch data whenever the filter changes

  // Function to fetch data based on filter
  const fetchDataBasedOnFilter = async (filter) => {
    try {
      setLoading(true);
      let response;

      switch (filter) {
        case 'totally_unallocated': // Use /todo API for "Totally Unallocated" filter
          response = await fetch('http://localhost:5000/employees/todo');
          break;
        case 'draft':
          response = await fetch('http://localhost:5000/employees/drafts');
          break;
        case 'allocated': // Updated filter for "Allocated"
          response = await fetch('http://localhost:5000/employees/drafts');
          if (!response.ok) {
            throw new Error('Network response was not ok');
          }
          const allocatedEmployees = await response.json();
          // Filter employees with 100% allocation only
          const fullyAllocatedEmployees = allocatedEmployees.filter(employee => employee.Allocation === 100);
          setEmployeeData(fullyAllocatedEmployees);
          setFilteredEmployees(fullyAllocatedEmployees); // Initialize filtered employees
          setCount(fullyAllocatedEmployees.length);
          setLoading(false);
          return; // Exit after processing this filter case
        case 'benched': // New filter for "Benched"
          response = await fetch('http://localhost:5000/employees/client/innover'); // Use the new API endpoint
          if (!response.ok) {
            throw new Error('Network response was not ok');
          }
          const benchedEmployees = await response.json(); // Fetch employees associated with "Innover"
          setEmployeeData(benchedEmployees);
          setFilteredEmployees(benchedEmployees); // Initialize filtered employees
          setCount(benchedEmployees.length);
          setLoading(false);
          return; // Exit after processing this filter case
        case 'all':
        default:
          response = await fetch('http://localhost:5000/employees');
          break;
      }

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const data = await response.json();
      setEmployeeData(data);
      setFilteredEmployees(data); // Initialize filtered employees
      setCount(data.length);
    } catch (error) {
      console.error('Fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle search input change
  const handleSearchChange = (e) => {
    const searchValue = e.target.value;
    setSearchTerm(searchValue);
    applyFilters(searchValue);
  };

  // Apply search and filter logic
  const applyFilters = (searchTerm) => {
    // Convert search term to lowercase
    const lowerSearchTerm = searchTerm.toLowerCase();

    const filtered = employeeData.filter((employee) => {
      // Convert employee properties to lowercase for comparison
      const employeeName = employee.EmployeeName.toLowerCase();
      const email = employee.Email.toLowerCase();
      const employeeId = (employee?.EmployeeID || '').toString().toLowerCase();

      // Check if the employee matches the search term
      const matchesSearchTerm =
        employeeName.includes(lowerSearchTerm) ||
        email.includes(lowerSearchTerm) ||
        employeeId.includes(lowerSearchTerm);

      return matchesSearchTerm;
    });

    setFilteredEmployees(filtered);
  };

  // Handle filter dropdown change
  const handleFilterChange = (e, { value }) => {
    setFilter(value); // Update filter, triggering useEffect to fetch new data
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
    { key: 'totally_unallocated', text: 'Totally Unallocated', value: 'totally_unallocated' },
    { key: 'draft', text: 'Draft', value: 'draft' },
    { key: 'allocated', text: 'Allocated', value: 'allocated' }, // Updated filter option for Allocated
    { key: 'benched', text: 'Benched', value: 'benched' }, // New filter option for Benched
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
