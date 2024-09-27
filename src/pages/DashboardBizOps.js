import React, { useEffect, useState } from 'react';
import { Table, Icon, Input, Button, Message } from 'semantic-ui-react';
import ViewCard from '../components/ViewCards/Viewcard';
import { useNavigate } from 'react-router-dom';
import './DashboardBizOps.css';
import * as XLSX from 'xlsx';
import axios from 'axios';

const DashboardBizOps = () => {
  const navigate = useNavigate();

  // State variables for counts
  const [todo, setTodo] = useState(0); // Unallocated Employees
  const [draft, setDraft] = useState(0); // Draft Employees
  const [totalemp, setTotalEmp] = useState(0); // Total Employees
  const [activeProjects, setActiveProjects] = useState(0); // Active Projects

  // Loading and error states for counts
  const [countsLoading, setCountsLoading] = useState(true);
  const [countsError, setCountsError] = useState(null);

  // Existing state variables for allocations
  const [currentDate, setCurrentDate] = useState('');
  const [allocatedEmployees, setAllocatedEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortColumn, setSortColumn] = useState(null);
  const [sortDirection, setSortDirection] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage] = useState(10);
  const [filteredEmployees, setFilteredEmployees] = useState([]);

  // Fetch Counts from Backend
  const fetchCounts = async () => {
    setCountsLoading(true);
    setCountsError(null);

    try {
      const response = await axios.get('http://localhost:8080/bizops/card');
      const data = response.data;

      setTotalEmp(data.totalEmployees);
      setTodo(data.unallocatedEmployees);
      setDraft(data.draftEmployees);
      setActiveProjects(data.activeProjects);
      setCountsLoading(false);
    } catch (err) {
      console.error('Error fetching counts:', err);
      setCountsError('Failed to fetch counts. Please try again later.');
      setCountsLoading(false);
    }
  };


  // New state variables for date filters
  const [formData, setFormData] = useState({
    startDate: '',
    endDate: ''
  });
  const [isEndDateDisabled, setIsEndDateDisabled] = useState(true);
  const [minEndDate, setMinEndDate] = useState('');

  // New state variables for error handling
  const [error, setError] = useState(null);

  // Handle form input changes
  const handleChange = (e, { name, value }) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  
    if (name === 'startDate') {
      if (value) {
        setIsEndDateDisabled(false);
        setMinEndDate(value);
        setFormData(prev => ({
          ...prev,
          endDate: '', // Reset End Date when Start Date changes
        }));
        setAllocatedEmployees([]); // Optionally reset allocations when start date changes
        setFilteredEmployees([]);
      } else {
        setIsEndDateDisabled(true);
        setMinEndDate('');
        setFormData(prev => ({
          ...prev,
          endDate: '',
        }));
        setAllocatedEmployees([]); // Optionally reset allocations when start date is cleared
        setFilteredEmployees([]);
      }
    }
  
    if (name === 'endDate' && value) {
      // Optional: Validate that endDate is not before startDate
      if (formData.startDate && value < formData.startDate) {
        setError('End Date cannot be before Start Date.');
        return;
      } else {
        setError(null);
        fetchAllocations(value, formData.startDate);
      }
    }
  };
  

  useEffect(() => {
    const { startDate, endDate } = formData;
    if (startDate && endDate) {
      fetchAllocations(endDate, startDate);
    }
  }, [formData.startDate, formData.endDate]);
  
  

  // Modify the function signature to accept both dates
  const fetchAllocations = async (endDateValue, startDateValue) => {
    setLoading(true);
    setError(null);

    try {
      const params = {};
      if (startDateValue) params.startDate = startDateValue;
      if (endDateValue) params.endDate = endDateValue;

      const response = await axios.get('http://localhost:8080/master-allocations', { params });
      const data = response.data.masterAllocations;

      setAllocatedEmployees(data);
      setFilteredEmployees(data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching master allocations:', err);
      setError('Failed to fetch allocations. Please try again later.');
      setLoading(false);
    }
  };

  

  // Fetch Counts from Backend
  useEffect(() => {
    fetchCounts();
  
    // Set current date
    const today = new Date();
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    const formattedDate = today.toLocaleDateString('en-US', options);
    setCurrentDate(formattedDate);
  
    // Calculate first day of the current month
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const formattedFirstDay = firstDay.toISOString().split('T')[0]; // YYYY-MM-DD
  
    // Format today's date as YYYY-MM-DD
    const formattedToday = today.toISOString().split('T')[0];
  
    // Set formData with default date range
    setFormData({
      startDate: formattedFirstDay,
      endDate: formattedToday
    });
  
    // Enable End Date input
    setIsEndDateDisabled(false);
    setMinEndDate(formattedFirstDay);
  
    // Fetch allocations for the default date range
    fetchAllocations(formattedToday, formattedFirstDay);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  

  // Navigation Handlers
  const handleUnallocatedClick = () => {
    navigate('/employees', { state: { filter: 'unallocated' } });
  };

  const handleDraftClick = () => {
    navigate('/employees', { state: { filter: 'draft' } });
  };

  const handleEmployeeClick = () => {
    navigate('/employees', { state: { filter: 'all' } });
  };

  // Fetch counts on component mount
  useEffect(() => {
    fetchCounts();

    // Set current date
    const today = new Date();
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    const formattedDate = today.toLocaleDateString('en-US', options);
    setCurrentDate(formattedDate);

    // Calculate first day of the current month
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const formattedFirstDay = firstDay.toISOString().split('T')[0]; // YYYY-MM-DD

    // Format today's date as YYYY-MM-DD
    const formattedToday = today.toISOString().split('T')[0];

    // Set formData with default date range
    setFormData({
      startDate: formattedFirstDay,
      endDate: formattedToday
    });

    // Enable End Date input
    setIsEndDateDisabled(false);
    setMinEndDate(formattedFirstDay);

    // Fetch allocations for the default date range
    fetchAllocations(formattedToday);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // Apply filters whenever allocatedEmployees or searchTerm changes
    applyFilters(searchTerm);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allocatedEmployees, searchTerm]);

  // Handle search
  const handleSearchChange = (e) => {
    const searchValue = e.target.value.toLowerCase();
    setSearchTerm(searchValue);
    applyFilters(searchValue);
    setCurrentPage(1);
  };

  // Apply search filter
  const applyFilters = (searchValue) => {
    let filtered = allocatedEmployees.filter((employee) =>
      employee.EmployeeName.toLowerCase().includes(searchValue) ||
      (employee.Email && employee.Email.toLowerCase().includes(searchValue)) ||
      employee.EmployeeID.toString().toLowerCase().includes(searchValue)
    );
    setFilteredEmployees(filtered);
  };

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

  // Function to render sort icon
  const renderSortIcon = (column) => {
    if (sortColumn !== column) return null;
    if (sortDirection === 'ascending') {
      return <Icon name="sort up" />;
    } else {
      return <Icon name="sort down" />;
    }
  };

  // Pagination logic
  const indexOfLastEmployee = currentPage * rowsPerPage;
  const indexOfFirstEmployee = indexOfLastEmployee - rowsPerPage;
  const currentEmployees = filteredEmployees.slice(indexOfFirstEmployee, indexOfLastEmployee);

  // Handle page change
  const paginate = (pageNumber) => {
    if (pageNumber < 1 || pageNumber > totalPages) return;
    setCurrentPage(pageNumber);
  };



  // Generate pagination numbers
  const totalPages = Math.ceil(filteredEmployees.length / rowsPerPage);
  const pageNumbers = [];
  for (let i = 1; i <= totalPages; i++) {
    pageNumbers.push(i);
  }

  // Download Excel
  const downloadExcel = () => {
    if (filteredEmployees.length === 0) {
      alert('No data available to download.');
      return;
    }

    // Map the data to include desired columns
    const dataToExport = filteredEmployees.map((emp) => ({
      'Allocation ID': emp.AllocationID,
      'Employee ID': emp.EmployeeID,
      'Employee Name': emp.EmployeeName,
      'Location': emp.EmployeeLocation,
      'Contract Type': emp.EmployeeContractType,
      'Joining Date': emp.EmployeeJoiningDate,
      'Ending Date': emp.EmployeeEndingDate,
      'Studio': emp.EmployeeStudio,
      'Sub Studio': emp.EmployeeSubStudio,
      'Role': emp.EmployeeRole,
      'TYOE': emp.EmployeeTYOE,
      'Keka Status': emp.EmployeeKekaStatus,
      'Client ID': emp.ClientID,
      'Client Name': emp.ClientName,
      'Client Partner': emp.ClientPartner,
      'Project ID': emp.ProjectID,
      'Project Name': emp.ProjectName,
      'Project Manager': emp.ProjectManager,
      'Allocation Status': emp.AllocationStatus,
      'Allocation %': emp.AllocationPercent,
      'Billing Type': emp.AllocationBillingType,
      'Billed Check': emp.AllocationBilledCheck ? 'Yes' : 'No',
      'Billing Rate': emp.AllocationBillingRate,
      'Timesheet Approver': emp.AllocationTimeSheetApprover,
      'Start Date': emp.AllocationStartDate,
      'End Date': emp.AllocationEndDate,
      'Modified By': emp.ModifiedBy,
      'Modified At': new Date(emp.ModifiedAt).toLocaleString()
    }));

    // Create a worksheet
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);

    // Create a workbook and append the worksheet
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Allocations');

    // Generate Excel file and trigger download
    XLSX.writeFile(workbook, 'allocations.xlsx');
  };

  return (
    <div className="main-layout">
      <div className='right-content'>
        {/* Greeting and Cards */}
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
                value={countsLoading ? 'Loading...' : todo}
                onClick={handleUnallocatedClick}
              />
            </div>
            <div className='cards'>
              <ViewCard
                icon="fa-users"
                header="Drafts"
                value={countsLoading ? 'Loading...' : draft}
                onClick={handleDraftClick}
              />
            </div>
            <div className='cards'>
              <ViewCard
                icon="fa-users"
                header="Employees"
                value={countsLoading ? 'Loading...' : totalemp}
                onClick={handleEmployeeClick}
              />
            </div>
            <div className='cards'>
              <ViewCard
                icon="fa-project-diagram"
                header="Projects"
                value={countsLoading ? 'Loading...' : activeProjects}
                onClick={() => navigate('/projects')}
              />
            </div>
          </div>

          {/* Display error message if counts failed to load */}
          {countsError && (
            <Message negative>
              <Message.Header>Error</Message.Header>
              <p>{countsError}</p>
            </Message>
          )}
        </>

        {/* Allocations Section */}
        <div className='last-edited'>
          <h2>Allocations</h2>

          {/* Search and Download Controls */}
          <div className='table-filter-layout'>
            {/* Date Filters and Search/Download */}
            <div className='filter-tabs'>
              {/* Start Date Input */}
              <Input
                type="date"
                name="startDate"
                value={formData.startDate}
                onChange={handleChange}
                placeholder="Start Date"
                min="2020-01-01"
                max="2030-12-31"
                style={{ marginRight: '10px' }}
                aria-label="Start Date"
              />
              -
              {/* End Date Input */}
              <Input
                type="date"
                name="endDate"
                value={formData.endDate}
                onChange={handleChange}
                min={minEndDate}
                disabled={isEndDateDisabled}
                placeholder="End Date"
                style={{ marginLeft: '10px', marginRight: '20px' }}
                aria-label="End Date"
              />
            </div>
            <div className='search-download-container'>
              {/* Search Input */}
              <Input
                icon="search"
                placeholder="Search by name, email, or ID..."
                value={searchTerm}
                onChange={handleSearchChange}
                aria-label="Search Employees"
                style={{ marginRight: '10px', width: '300px' }}
              />
              {/* Download Button */}
              <Button
                icon
                labelPosition='left'
                color='blue'
                onClick={downloadExcel}
                aria-label="Download Employees as Excel"
              >
                <Icon name='download' />
                Download
              </Button>
            </div>
          </div>

          {/* Allocation Table */}
          <div className='table-container'>
            {loading ? (
              <div className="loader">
                <Icon loading name='spinner' /> Loading...
              </div>
            ) : error ? (
              <Message negative>
                <Message.Header>Error</Message.Header>
                <p>{error}</p>
              </Message>
            ) : (
              <>
                <Table celled striped sortable>
                  <Table.Header>
                    <Table.Row>
                      <Table.HeaderCell onClick={() => handleSort('AllocationID')}>
                        Allocation ID {renderSortIcon('AllocationID')}
                      </Table.HeaderCell>
                      <Table.HeaderCell onClick={() => handleSort('EmployeeID')}>
                        Employee ID {renderSortIcon('EmployeeID')}
                      </Table.HeaderCell>
                      <Table.HeaderCell onClick={() => handleSort('EmployeeName')}>
                        Employee Name {renderSortIcon('EmployeeName')}
                      </Table.HeaderCell>
                      <Table.HeaderCell onClick={() => handleSort('EmployeeLocation')}>
                        Location {renderSortIcon('EmployeeLocation')}
                      </Table.HeaderCell>
                      <Table.HeaderCell onClick={() => handleSort('EmployeeContractType')}>
                        Contract Type {renderSortIcon('EmployeeContractType')}
                      </Table.HeaderCell>
                      <Table.HeaderCell onClick={() => handleSort('EmployeeJoiningDate')}>
                        Joining Date {renderSortIcon('EmployeeJoiningDate')}
                      </Table.HeaderCell>
                      <Table.HeaderCell onClick={() => handleSort('EmployeeEndingDate')}>
                        Ending Date {renderSortIcon('EmployeeEndingDate')}
                      </Table.HeaderCell>
                      <Table.HeaderCell onClick={() => handleSort('EmployeeStudio')}>
                        Studio {renderSortIcon('EmployeeStudio')}
                      </Table.HeaderCell>
                      <Table.HeaderCell onClick={() => handleSort('EmployeeSubStudio')}>
                        Sub Studio {renderSortIcon('EmployeeSubStudio')}
                      </Table.HeaderCell>
                      <Table.HeaderCell onClick={() => handleSort('EmployeeRole')}>
                        Role {renderSortIcon('EmployeeRole')}
                      </Table.HeaderCell>
                      <Table.HeaderCell onClick={() => handleSort('EmployeeTYOE')}>
                        TYOE {renderSortIcon('EmployeeTYOE')}
                      </Table.HeaderCell>
                      <Table.HeaderCell onClick={() => handleSort('EmployeeKekaStatus')}>
                        Keka Status {renderSortIcon('EmployeeKekaStatus')}
                      </Table.HeaderCell>
                      <Table.HeaderCell onClick={() => handleSort('ClientID')}>
                        Client ID {renderSortIcon('ClientID')}
                      </Table.HeaderCell>
                      <Table.HeaderCell onClick={() => handleSort('ClientName')}>
                        Client Name {renderSortIcon('ClientName')}
                      </Table.HeaderCell>
                      <Table.HeaderCell onClick={() => handleSort('ClientPartner')}>
                        Client Partner {renderSortIcon('ClientPartner')}
                      </Table.HeaderCell>
                      <Table.HeaderCell onClick={() => handleSort('ProjectID')}>
                        Project ID {renderSortIcon('ProjectID')}
                      </Table.HeaderCell>
                      <Table.HeaderCell onClick={() => handleSort('ProjectName')}>
                        Project Name {renderSortIcon('ProjectName')}
                      </Table.HeaderCell>
                      <Table.HeaderCell onClick={() => handleSort('ProjectManager')}>
                        Project Manager {renderSortIcon('ProjectManager')}
                      </Table.HeaderCell>
                      <Table.HeaderCell onClick={() => handleSort('AllocationStatus')}>
                        Status {renderSortIcon('AllocationStatus')}
                      </Table.HeaderCell>
                      <Table.HeaderCell onClick={() => handleSort('AllocationPercent')}>
                        Allocation % {renderSortIcon('AllocationPercent')}
                      </Table.HeaderCell>
                      <Table.HeaderCell onClick={() => handleSort('AllocationBillingType')}>
                        Billing Type {renderSortIcon('AllocationBillingType')}
                      </Table.HeaderCell>
                      <Table.HeaderCell onClick={() => handleSort('AllocationBilledCheck')}>
                        Billed Check {renderSortIcon('AllocationBilledCheck')}
                      </Table.HeaderCell>
                      <Table.HeaderCell onClick={() => handleSort('AllocationBillingRate')}>
                        Billing Rate {renderSortIcon('AllocationBillingRate')}
                      </Table.HeaderCell>
                      <Table.HeaderCell onClick={() => handleSort('AllocationTimeSheetApprover')}>
                        Timesheet Approver {renderSortIcon('AllocationTimeSheetApprover')}
                      </Table.HeaderCell>
                      <Table.HeaderCell onClick={() => handleSort('AllocationStartDate')}>
                        Start Date {renderSortIcon('AllocationStartDate')}
                      </Table.HeaderCell>
                      <Table.HeaderCell onClick={() => handleSort('AllocationEndDate')}>
                        End Date {renderSortIcon('AllocationEndDate')}
                      </Table.HeaderCell>
                      <Table.HeaderCell onClick={() => handleSort('ModifiedBy')}>
                        Modified By {renderSortIcon('ModifiedBy')}
                      </Table.HeaderCell>
                      <Table.HeaderCell onClick={() => handleSort('ModifiedAt')}>
                        Modified At {renderSortIcon('ModifiedAt')}
                      </Table.HeaderCell>
                    </Table.Row>
                  </Table.Header>

                  <Table.Body>
                    {currentEmployees.length > 0 ? (
                      currentEmployees.map((employee) => (
                        <Table.Row key={employee.AllocationID}>
                          <Table.Cell>{employee.AllocationID}</Table.Cell>
                          <Table.Cell>{employee.EmployeeID}</Table.Cell>
                          <Table.Cell>{employee.EmployeeName}</Table.Cell>
                          <Table.Cell>{employee.EmployeeLocation}</Table.Cell>
                          <Table.Cell>{employee.EmployeeContractType}</Table.Cell>
                          <Table.Cell>{employee.EmployeeJoiningDate}</Table.Cell>
                          <Table.Cell>{employee.EmployeeEndingDate}</Table.Cell>
                          <Table.Cell>{employee.EmployeeStudio}</Table.Cell>
                          <Table.Cell>{employee.EmployeeSubStudio}</Table.Cell>
                          <Table.Cell>{employee.EmployeeRole}</Table.Cell>
                          <Table.Cell>{employee.EmployeeTYOE}</Table.Cell>
                          <Table.Cell>{employee.EmployeeKekaStatus}</Table.Cell>
                          <Table.Cell>{employee.ClientID}</Table.Cell>
                          <Table.Cell>{employee.ClientName}</Table.Cell>
                          <Table.Cell>{employee.ClientPartner}</Table.Cell>
                          <Table.Cell>{employee.ProjectID}</Table.Cell>
                          <Table.Cell>{employee.ProjectName}</Table.Cell>
                          <Table.Cell>{employee.ProjectManager}</Table.Cell>
                          <Table.Cell>{employee.AllocationStatus}</Table.Cell>
                          <Table.Cell>{employee.AllocationPercent}%</Table.Cell>
                          <Table.Cell>{employee.AllocationBillingType}</Table.Cell>
                          <Table.Cell>{employee.AllocationBilledCheck ? 'Yes' : 'No'}</Table.Cell>
                          <Table.Cell>{employee.AllocationBillingRate}</Table.Cell>
                          <Table.Cell>{employee.AllocationTimeSheetApprover}</Table.Cell>
                          <Table.Cell>{employee.AllocationStartDate}</Table.Cell>
                          <Table.Cell>{employee.AllocationEndDate}</Table.Cell>
                          <Table.Cell>{employee.ModifiedBy}</Table.Cell>
                          <Table.Cell>{new Date(employee.ModifiedAt).toLocaleString()}</Table.Cell>
                        </Table.Row>
                      ))
                    ) : (
                      <Table.Row>
                        <Table.Cell colSpan="26" textAlign="center">
                          No allocations found matching the criteria.
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
                      aria-label="Previous Page"
                    >
                      Back
                    </button>
                    {pageNumbers.map(number => (
                      <button
                        key={number}
                        onClick={() => paginate(number)}
                        className={`pagination-button ${currentPage === number ? 'active' : ''}`}
                        aria-label={`Page ${number}`}
                      >
                        {number}
                      </button>
                    ))}
                    <button
                      onClick={() => paginate(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="pagination-button"
                      aria-label="Next Page"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardBizOps;
