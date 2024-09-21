// All Employees Page
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
  const rowsPerPage = 20; // Rows per page set to 20

  useEffect(() => {
    fetchDataBasedOnFilter(filter);
  }, [filter]); // Re-fetch data whenever the filter changes
  const fetchDataBasedOnFilter = async (filter) => {
    try {
      setLoading(true);
      let endpoint;

      switch (filter) {
        case 'unallocated':
          endpoint = 'http://localhost:8080/employees/unallocated';
          break;
        case 'draft':
          endpoint = 'http://localhost:8080/employees/draft';
          break;
        case 'allocated':
          endpoint = 'http://localhost:8080/employees/allocated';
          break;
        case 'bench':
          endpoint = 'http://localhost:8080/employees/bench';
          break;
        case 'all':
        default:
          endpoint = 'http://localhost:8080/employees';
          break;
      }

      const response = await fetch(endpoint);
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const data = await response.json();
      setEmployeeData(data);
      setFilteredEmployees(data);
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
      const employeeId = (employee?.EmployeeID || '').toString().toLowerCase();
      const employeeRole = (employee.EmployeeRole || '').toLowerCase();
      const projects = (employee.Projects || []).join(', ').toLowerCase();

      // Check if the employee matches the search term
      const matchesSearchTerm =
        employeeName.includes(lowerSearchTerm) ||
        employeeId.includes(lowerSearchTerm) ||
        employeeRole.includes(lowerSearchTerm) ||
        projects.includes(lowerSearchTerm);

      return matchesSearchTerm;
    });

    setFilteredEmployees(filtered);
    setCount(filtered.length);
    setCurrentPage(1); // Reset to first page when filtering
  };

  // Handle filter dropdown change
  const handleFilterChange = (value) => { // Simplified parameter
    setFilter(value); // Update filter, triggering useEffect to fetch new data
    setSearchTerm(''); // Reset search term when changing filter
  };

  // Handle navigation to individual employee details
  const handleEmployeeClick = (employee) => {
    navigate(`/employee/${employee.EmployeeID}`, {
      state: {
        employee,
        allocationPercentage: employee.Current_Allocation, // Pass the current allocation percentage
      },
    });
  };

  // Function to handle back navigation
  const handleBackClick = () => {
    navigate(-1); // Go back to the previous page
  };


  const downloadExcel = async () => {
    const filters = ['all', 'unallocated', 'draft', 'allocated', 'bench'];
    const workbook = XLSX.utils.book_new();
  
    try {
      for (const filter of filters) {
        const endpoint = `http://localhost:8080/employees${filter === 'all' ? '' : `/${filter}`}`;
        const response = await fetch(endpoint);
        if (!response.ok) {
          throw new Error(`Failed to fetch ${filter} data`);
        }
        const data = await response.json();
  
        const worksheet = XLSX.utils.json_to_sheet(data.map((employee) => ({
          'Employee ID': employee.EmployeeID,
          'Employee Name': employee.EmployeeName,
          'Employee Role': employee.EmployeeRole,
          'Projects': employee.Projects.join(', '),
          'Current Allocation %': employee.Current_Allocation,
        })));
  
        XLSX.utils.book_append_sheet(workbook, worksheet, filter.charAt(0).toUpperCase() + filter.slice(1));
      }
  
      XLSX.writeFile(workbook, 'employee-data.xlsx');
    } catch (error) {
      console.error('Error downloading Excel file:', error);
      // You might want to show an error message to the user here
    }
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
              onClick={() => handleFilterChange('all')}
            >
              All
            </button>
            <button
              className={`tab ${filter === 'unallocated' ? 'active' : ''}`}
              onClick={() => handleFilterChange('unallocated')}
            >
              Unallocated
            </button>
            <button
              className={`tab ${filter === 'draft' ? 'active' : ''}`}
              onClick={() => handleFilterChange('draft')}
            >
              Draft
            </button>
            <button
              className={`tab ${filter === 'allocated' ? 'active' : ''}`}
              onClick={() => handleFilterChange('allocated')}
            >
              Allocated
            </button>
            <button
              className={`tab ${filter === 'bench' ? 'active' : ''}`}
              onClick={() => handleFilterChange('bench')}
            >
              Bench
            </button>
          </div>

          {/* Search and Download Container */}
          <div className="search-download-container">
            {/* Search Bar */}
            <Input
              icon="search"
              placeholder="Search by ID, or Name..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="search-bar"
              style={{ marginRight: '10px', width: '300px' }}
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
                  sorted={sortColumn === 'EmployeeRole' ? sortDirection : null}
                  onClick={() => handleSort('EmployeeRole')}
                >
                  Employee Role
                </Table.HeaderCell>
                <Table.HeaderCell
                  sorted={sortColumn === 'Projects' ? sortDirection : null}
                  onClick={() => handleSort('Projects')}
                >
                  Projects
                </Table.HeaderCell>
                <Table.HeaderCell
                  sorted={sortColumn === 'Current_Allocation' ? sortDirection : null}
                  onClick={() => handleSort('Current_Allocation')}
                >
                  Current Allocation %
                </Table.HeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {loading ? (
                <Table.Row>
                  <Table.Cell colSpan="5" textAlign="center">
                    Loading...
                  </Table.Cell>
                </Table.Row>
              ) : currentEmployees.length > 0 ? (
                currentEmployees.map((employee) => (
                  <Table.Row key={employee.EmployeeID} onClick={() => handleEmployeeClick(employee)} style={{ cursor: 'pointer' }}>
                    <Table.Cell>{employee.EmployeeID}</Table.Cell>
                    <Table.Cell>{employee.EmployeeName}</Table.Cell>
                    <Table.Cell>{employee.EmployeeRole}</Table.Cell>
                    <Table.Cell>{employee.Projects.join(', ')}</Table.Cell>
                    <Table.Cell>{employee.Current_Allocation}%</Table.Cell>
                  </Table.Row>
                ))
              ) : (
                <Table.Row>
                  <Table.Cell colSpan="5" textAlign="center">
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