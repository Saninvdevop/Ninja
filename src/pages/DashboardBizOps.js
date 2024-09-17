import React, { useEffect, useState } from 'react';
import { Table, Icon, Input, Button, Dropdown } from 'semantic-ui-react';
import ViewCard from '../components/ViewCards/Viewcard'; // Import ViewCard component
import { useNavigate } from 'react-router-dom'; // Import useNavigate for navigation
import './DashboardBizOps.css'; // Import CSS for consistent styling
import * as XLSX from 'xlsx';


const DashboardBizOps = () => {
  const navigate = useNavigate(); // Initialize useNavigate for navigation
  const [currentDate, setCurrentDate] = useState(''); // State to hold current date
  const [todo, setTodo] = useState();
  const [draft, setDraft] = useState();
  const activeProjects = 80;
  const [allocatedEmployees, setAllocatedEmployees] = useState([]);
  const [benchedEmployees, setBenchedEmployees] = useState([]);
  const [filter, setFilter] = useState('allocated'); // Default filter is "allocated"
  const [loading, setLoading] = useState(true); // Loading state
  const [totalemp, setTotalEmp] = useState();
  const [searchTerm, setSearchTerm] = useState(''); // Search term state
  const [sortColumn, setSortColumn] = useState(null); // Track which column is sorted
  const [sortDirection, setSortDirection] = useState(null); // Track sort direction
  const [currentPage, setCurrentPage] = useState(1); // Track current page
  const [rowsPerPage] = useState(5); // Rows per page set to 20 for pagination
  const [filteredEmployees, setFilteredEmployees] = useState([]); // Filtered employee data
  const [filterTags, setFilterTags] = useState([]); // State for multiple filter tags

  // Get current date
  useEffect(() => {
    const today = new Date();
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    const formattedDate = today.toLocaleDateString('en-US', options);
    setCurrentDate(formattedDate);
  }, []);

  // Fetch data from APIs
  useEffect(() => {
    const fetchEmployeeData = async () => {
      try {
        setLoading(true);
        const allocatedResponse = await fetch('http://localhost:8080/employees/drafts');
        const benchedResponse = await fetch('http://localhost:8080/employees/todo');
        const totalResponse = await fetch('http://localhost:8080/employees');

        if (!allocatedResponse.ok || !benchedResponse.ok || !totalResponse.ok) {
          throw new Error('Network response was not ok');
        }

        const allocatedData = await allocatedResponse.json();
        const benchedData = await benchedResponse.json();
        const totalData = await totalResponse.json();

        setDraft(allocatedData.length);
        setAllocatedEmployees(allocatedData);
        setTodo(benchedData.length);
        setBenchedEmployees(benchedData);
        setTotalEmp(totalData.length);
        setFilteredEmployees(allocatedData); // Set the filteredEmployees to the allocated data initially
      } catch (error) {
        console.error('Fetch error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEmployeeData();
  }, []);

  // Handle sorting
  const handleSort = (column) => {
    const direction = sortColumn === column && sortDirection === 'ascending' ? 'descending' : 'ascending';
    const sortedData = [...filteredEmployees].sort((a, b) => {
      if (a[column] < b[column]) return direction === 'ascending' ? -1 : 1;
      if (a[column] > b[column]) return direction === 'ascending' ? 1 : -1;
      return 0;
    });
    setFilteredEmployees(sortedData);
    setSortColumn(column);
    setSortDirection(direction);
  };

  // Handle search
  const handleSearchChange = (e) => {
    const searchValue = e.target.value.toLowerCase();
    setSearchTerm(searchValue);
    applyFilters(searchValue, filterTags);
    setCurrentPage(1); // Reset to the first page when searching
  };

  // Handle filter tag selection
  const handleFilterChange = (e, { value }) => {
    setFilterTags(value);
    applyFilters(searchTerm, value);
    setCurrentPage(1); // Reset to the first page when filtering
  };

  // Apply search and tag filters
  const applyFilters = (searchValue, tags) => {
    let filtered = allocatedEmployees.filter((employee) =>
      employee.EmployeeName.toLowerCase().includes(searchValue) ||
      employee.Email.toLowerCase().includes(searchValue) ||
      employee.EmployeeID.toString().toLowerCase().includes(searchValue)
    );

    if (tags.length > 0) {
      filtered = filtered.filter((employee) => tags.includes(employee.Tag));
    }

    setFilteredEmployees(filtered);
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

  // Function to render sort icon
  const renderSortIcon = (column) => {
    if (sortColumn !== column) return null;
    if (sortDirection === 'ascending') {
      return <Icon name="sort up" />;
    } else {
      return <Icon name="sort down" />;
    }
  };

  // Download Excel
  const downloadExcel = () => {
    if (filteredEmployees.length === 0) {
      alert('No data available to download.');
      return;
    }

    // Map the data to include desired columns
    const dataToExport = filteredEmployees.map((emp) => ({
      'Employee ID': emp.EmployeeID,
      'Employee Name': emp.EmployeeName,
      'Email': emp.Email,
      'Allocation %': emp.Allocation,
      // Add other fields if necessary
    }));

    // Create a worksheet
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);

    // Create a workbook and append the worksheet
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Employees');

    // Generate Excel file and trigger download
    XLSX.writeFile(workbook, 'employees.xlsx');
  };


  // Filter Dropdown Options
  const filterOptions = [
    { key: 'important', text: 'Important', value: 'Important' },
    { key: 'announcement', text: 'Announcement', value: 'Announcement' },
    { key: 'discussion', text: 'Discussion', value: 'Discussion' },
  ];

  return (
    <div className="main-layout">
      <div className='right-content'>
        {/* Conditionally render Greeting and Cards only on the first page */}
        {currentPage === 1 && (
          <>
            <div className='top-content'>
              <div className='greeting'>
                <h1>Hello Ravi,</h1>
                <h2>{currentDate}</h2>
              </div>
            </div>

            <div className='bottom-content-cards'>
              <div className='cards'>
                <ViewCard
                  icon="fa-users"
                  header="Unallocated"
                  value={todo}
                  onClick={() => navigate('/unallocated')}
                />
              </div>
              <div className='cards'>
                <ViewCard
                  icon="fa-users"
                  header="Drafts"
                  value={draft}
                  onClick={() => navigate('/todo')}
                />
              </div>
              <div className='cards'>
                <ViewCard
                  icon="fa-users"
                  header="Employees"
                  value={totalemp} // Changed from draft to totalemp
                  onClick={() => navigate('/employees')}
                />
              </div>
              <div className='cards'>
                <ViewCard
                  icon="fa-project-diagram"
                  header="Projects"
                  value={activeProjects}
                  onClick={() => navigate('/projects')}
                />
              </div>
            </div>
          </>
        )}

        <div className='last-edited'>
          <h2>Allocations</h2>

          {/* Search, Download, and Filter Controls */}
          <div className='controls'>
            {/* Left Side: Filter Dropdown */}
            <div className='left-controls'>
              <Dropdown
                placeholder='Filter'
                icon='filter'
                floating
                labeled
                button
                className='icon'
                options={filterOptions}
                onChange={handleFilterChange}
                clearable
                multiple
                selection
                value={filterTags}
                aria-label="Filter Employees"
              />
            </div>

            {/* Right Side: Search Input and Download Button */}
            <div className='right-controls'>
              <Input
                icon="search"
                placeholder="Search by name, email, or ID..."
                value={searchTerm}
                onChange={handleSearchChange}
                aria-label="Search Employees"
                style={{ marginRight: '10px' }}
              />
              <Button
                icon
                labelPosition='left'
                color='blue'
                onClick={downloadExcel} // Updated to downloadExcel
                aria-label="Download Employees as Excel"
              >
                <Icon name='download' />
                Download
              </Button>

            </div>
          </div>

          {/* Employee Table with Sort, Search, and Pagination */}
          <div className='table'>
            {loading ? (
              <div className="loader">
                <Icon loading name='spinner' /> Loading...
              </div>
            ) : (
              <>
                <Table celled striped sortable>
                  <Table.Header>
                    <Table.Row>
                      <Table.HeaderCell onClick={() => handleSort('EmployeeID')}>
                        Employee ID {renderSortIcon('EmployeeID')}
                      </Table.HeaderCell>
                      <Table.HeaderCell onClick={() => handleSort('EmployeeName')}>
                        Employee Name {renderSortIcon('EmployeeName')}
                      </Table.HeaderCell>
                      <Table.HeaderCell onClick={() => handleSort('Email')}>
                        Email {renderSortIcon('Email')}
                      </Table.HeaderCell>
                      <Table.HeaderCell onClick={() => handleSort('Allocation')}>
                        Current Allocation % {renderSortIcon('Allocation')}
                      </Table.HeaderCell>
                    </Table.Row>
                  </Table.Header>

                  <Table.Body>
                    {currentEmployees.length > 0 ? (
                      currentEmployees.map((employee) => (
                        <Table.Row key={employee.EmployeeID}>
                          <Table.Cell>{employee.EmployeeID}</Table.Cell>
                          <Table.Cell>{employee.EmployeeName}</Table.Cell>
                          <Table.Cell>{employee.Email}</Table.Cell>
                          <Table.Cell>{employee.Allocation}%</Table.Cell>
                        </Table.Row>
                      ))
                    ) : (
                      <Table.Row>
                        <Table.Cell colSpan="4" textAlign="center">
                          No employees found matching the criteria.
                        </Table.Cell>
                      </Table.Row>
                    )}
                  </Table.Body>
                </Table>

                {/* Custom Pagination Controls */}
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
              </>
            )}

            {/* Display Error Message if no data */}
            {!loading && filteredEmployees.length === 0 && (
              <div className="error-message">No employees found matching the criteria.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardBizOps;
