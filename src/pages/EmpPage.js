import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, Input, Button } from 'semantic-ui-react';
import './EmpPage.css';
import * as XLSX from 'xlsx';

const EmpPage = () => {
  const navigate = useNavigate(); // For navigation to employee details

  // State for employee data and loading status
  const [employeeData, setEmployeeData] = useState([]);
  const [loading, setLoading] = useState(false);

  // State for search and filter
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [filter, setFilter] = useState('all');
  const [count, setCount] = useState(0);
  const [sortColumn, setSortColumn] = useState(null); // Track the currently sorted column
  const [sortDirection, setSortDirection] = useState(null); // Track the sort direction (asc/desc)
  const [currentPage, setCurrentPage] = useState(1); // Track current page
  const rowsPerPage = 10; // Rows per page set to 10

  useEffect(() => {
    fetchDataBasedOnFilter(filter);
  }, [filter]); // Re-fetch data whenever the filter changes

  // Function to fetch data based on filter
  const fetchDataBasedOnFilter = async (filter) => {
    try {
      setLoading(true);
      let response;

      switch (filter) {
        case 'unallocated': // Use /todo API for "Unallocated" filter
          response = await fetch('http://localhost:8080/employees/todo');
          break;
        case 'draft':
          response = await fetch('http://localhost:8080/employees/drafts');
          break;
        case 'allocated': // Updated filter for "Allocated"
          response = await fetch('http://localhost:8080/employees/drafts');
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
        case 'bench': // New filter for "Benched"
          response = await fetch('http://localhost:8080/employees/drafts');
          if (!response.ok) {
            throw new Error('Network response was not ok');
          }
          const allEmployees = await response.json();
          // Filter employees where Client is "Innover" and Project is "Benched"
          const benchEmployees = allEmployees.filter(employee =>
            employee.ClientName === 'Innover' && employee.ProjectName === 'Benched'
          );
          setEmployeeData(benchEmployees);
          setFilteredEmployees(benchEmployees); 
          setCount(benchEmployees.length);
          setLoading(false);
          return;
        case 'all':
        default:
          response = await fetch('http://localhost:8080/employees');
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

  // Sorting logic
  const handleSort = (column) => {
    const isAscending = sortColumn === column && sortDirection === 'ascending';
    const direction = isAscending ? 'descending' : 'ascending';

    const sortedData = [...filteredEmployees].sort((a, b) => {
      if (a[column] < b[column]) {
        return direction === 'ascending' ? -1 : 1;
      } else if (a[column] > b[column]) {
        return direction === 'ascending' ? 1 : -1;
      }
      return 0;
    });

    setFilteredEmployees(sortedData);
    setSortColumn(column);
    setSortDirection(direction);
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
    setCount(filtered.length);
    setCurrentPage(1); // Reset to first page when filtering
  };

  // Handle filter dropdown change
  const handleFilterChange = (e, { value }) => {
    setFilter(value); // Update filter, triggering useEffect to fetch new data
    setSearchTerm(''); // Reset search term when changing filter
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

  // Filter options for the dropdown (if you decide to use it)
  const filterOptions = [
    { key: 'all', text: 'All', value: 'all' },
    { key: 'unallocated', text: 'Unallocated', value: 'unallocated' },
    { key: 'draft', text: 'Draft', value: 'draft' },
    { key: 'allocated', text: 'Allocated', value: 'allocated' }, // Updated filter option for Allocated
    { key: 'bench', text: 'Bench', value: 'bench' }, // New filter option for Benched
  ];

  // Function to download current filtered and sorted data as Excel
  const downloadExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(filteredEmployees.map((employee) => ({
      'Employee ID': employee.EmployeeID,
      'Employee Name': employee.EmployeeName,
      'Email': employee.Email,
      'Current Allocation %': employee.Allocation,
    })));
    
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Employees');
    
    XLSX.writeFile(workbook, 'employee-data.xlsx');
  };

  // Pagination logic
  const indexOfLastEmployee = currentPage * rowsPerPage;
  const indexOfFirstEmployee = indexOfLastEmployee - rowsPerPage;
  const currentEmployees = filteredEmployees.slice(indexOfFirstEmployee, indexOfLastEmployee);

  // Handle page change
  const paginate = (pageNumber) => {
    if (pageNumber < 1) return;
    if (pageNumber > totalPages) return;
    setCurrentPage(pageNumber);
  };

  // Generate pagination numbers
  const totalPages = Math.ceil(filteredEmployees.length / rowsPerPage);
  const pageNumbers = [];
  for (let i = 1; i <= totalPages; i++) {
    pageNumbers.push(i);
  }

  return (
    <div className="main-layout">
      <div className='right-content'>
        {/* Breadcrumb Section */}
        <div className='breadcrumb'>
          <h2 className="breadcrumb-text">Employees</h2>
        </div>

        <div className='table-filter-layout'>
          {/* Filter Tabs */}
          <div className="filter-tabs">
            <button
              className={`tab ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
            >
              All
            </button>
            <button
              className={`tab ${filter === 'unallocated' ? 'active' : ''}`}
              onClick={() => setFilter('unallocated')}
            >
              Unallocated
            </button>
            <button
              className={`tab ${filter === 'draft' ? 'active' : ''}`}
              onClick={() => setFilter('draft')}
            >
              Draft
            </button>
            <button
              className={`tab ${filter === 'allocated' ? 'active' : ''}`}
              onClick={() => setFilter('allocated')}
            >
              Allocated
            </button>
            <button
              className={`tab ${filter === 'bench' ? 'active' : ''}`}
              onClick={() => setFilter('bench')}
            >
              Bench
            </button>
          </div>

          {/* Search and Download Container */}
          <div className="search-download-container">
            {/* Search Bar */}
            <Input
              icon="search"
              placeholder="Search by name, email, or ID..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="search-bar"
            />

            {/* Download Button */}
            <Button
              icon
              labelPosition="left"
              color="blue"
              onClick={downloadExcel}
              className="download-button"
            >
              <i className="download icon"></i>
              Download
            </Button>
          </div>
        </div>

        {/* Employee Table Section */}
        <div className='table'>
          <Table celled striped sortable>
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell
                  sorted={sortColumn === 'EmployeeID' ? sortDirection : null}
                  onClick={() => handleSort('EmployeeID')}
                >
                  Employee ID
                </Table.HeaderCell>
                <Table.HeaderCell
                  sorted={sortColumn === 'EmployeeName' ? sortDirection : null}
                  onClick={() => handleSort('EmployeeName')}
                >
                  Employee Name
                </Table.HeaderCell>
                <Table.HeaderCell
                  sorted={sortColumn === 'Email' ? sortDirection : null}
                  onClick={() => handleSort('Email')}
                >
                  Email
                </Table.HeaderCell>
                <Table.HeaderCell
                  sorted={sortColumn === 'Allocation' ? sortDirection : null}
                  onClick={() => handleSort('Allocation')}
                >
                  Current Allocation %
                </Table.HeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {loading ? (
                <Table.Row>
                  <Table.Cell colSpan="4" textAlign="center">
                    Loading...
                  </Table.Cell>
                </Table.Row>
              ) : currentEmployees.length > 0 ? (
                currentEmployees.map((employee) => (
                  <Table.Row key={employee.EmployeeID} onClick={() => handleEmployeeClick(employee)} style={{ cursor: 'pointer' }}>
                    <Table.Cell>{employee.EmployeeID}</Table.Cell>
                    <Table.Cell>{employee.EmployeeName}</Table.Cell>
                    <Table.Cell>{employee.Email}</Table.Cell>
                    <Table.Cell>{employee.Allocation}%</Table.Cell>
                  </Table.Row>
                ))
              ) : (
                <Table.Row>
                  <Table.Cell colSpan="4" textAlign="center">
                    No employees found.
                  </Table.Cell>
                </Table.Row>
              )}
            </Table.Body>
          </Table>
        </div>

        {/* Pagination Section */}
        {totalPages > 1 && (
          <div className="pagination">
            <button
              onClick={() => paginate(currentPage - 1)}
              disabled={currentPage === 1}
              className="pagination-button"
            >
              Back
            </button>
            {pageNumbers.map(number => (
              <button
                key={number}
                onClick={() => paginate(number)}
                className={`pagination-button ${currentPage === number ? 'active' : ''}`}
              >
                {number}
              </button>
            ))}
            <button
              onClick={() => paginate(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="pagination-button"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmpPage;
