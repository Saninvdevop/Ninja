// Client -> project -> employees and sync
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Table, Icon, Button, Modal, Form, Dropdown, Message, Loader } from 'semantic-ui-react';
import './ClientDetails.css'; // Custom CSS for styling
import { IoMdClose } from "react-icons/io"; // Import Discard Icon
import { MdCheck } from "react-icons/md";
import * as XLSX from 'xlsx'; // Import SheetJS
import { saveAs } from 'file-saver'; // Import FileSaver

const ClientDetails = ({ userRole }) => {
  const navigate = useNavigate();
  const { clientId, projectId } = useParams();

  // State variables to store client and project names
  const [clientName, setClientName] = useState('');
  const [projectName, setProjectName] = useState('');

  const [open, setOpen] = useState(false);
  const [showMessage, setShowMessage] = useState(false);
  const [resourceName, setResourceName] = useState('');
  const [allocationPercentage, setAllocationPercentage] = useState('');
  const [employeesData, setEmployeesData] = useState([]);
  const [filter, setFilter] = useState('active'); // Set default filter to 'active'
  const [sortConfig, setSortConfig] = useState({ key: null, direction: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [isDownloading, setIsDownloading] = useState(false); // New state for download process

  // Placeholder employee options
  const employeeOptions = [
    { key: 1, text: 'Alice Johnson', value: 'Alice Johnson' },
    { key: 2, text: 'Bob Williams', value: 'Bob Williams' },
    // Add more placeholder options as needed
  ];

  // Fetch allocations from the backend API based on selected filter
  const fetchAllocations = async (currentFilter) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`http://localhost:8080/project-details/${clientId}/${projectId}?filter=${currentFilter}`);
      if (response.ok) {
        const data = await response.json();
        console.log('Fetched Data:', data); // Add this line for debugging
        setClientName(data.clientName);
        setProjectName(data.projectName);
        setEmployeesData(data.allocations);
      } else if (response.status === 404) {
        // Handle 404 by assuming no allocations found
        setClientName('Unknown Client'); // Or handle appropriately
        setProjectName('Unknown Project'); // Or handle appropriately
        setEmployeesData([]); // Clear allocations
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || `Error: ${response.status} ${response.statusText}`);
      }
    } catch (err) {
      console.error('Fetch error:', err);
      setError(err.message || 'Failed to load allocations');
      setEmployeesData([]); // Clear allocations on error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllocations(filter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId, projectId, filter]);

  // Handle Filter Change
  const handleFilterChange = (selectedFilter) => {
    setFilter(selectedFilter);
  };

  // Handle Sort
  const handleSort = (columnKey) => {
    let direction = 'ascending';
    if (sortConfig.key === columnKey && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key: columnKey, direction });
  };

  // Sort Data
  const sortedData = React.useMemo(() => {
    if (sortConfig.key === null) return employeesData;

    const sorted = [...employeesData].sort((a, b) => {
      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];

      // Handle null or undefined
      if (aValue === null || aValue === undefined) aValue = '';
      if (bValue === null || bValue === undefined) bValue = '';

      // If sorting by AllocationPercent, convert to number
      if (sortConfig.key === 'AllocationPercent') {
        aValue = parseFloat(aValue);
        bValue = parseFloat(bValue);
      } else {
        // Convert to uppercase string for case-insensitive sorting
        aValue = aValue.toString().toUpperCase();
        bValue = bValue.toString().toUpperCase();
      }

      if (aValue < bValue) {
        return sortConfig.direction === 'ascending' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'ascending' ? 1 : -1;
      }
      return 0;
    });

    return sorted;
  }, [employeesData, sortConfig]);

  // Handle Download Excel for All Filters
  const downloadExcel = async () => {
    setIsDownloading(true); // Start download process
    setError(null); // Reset any existing errors

    try {
      // Fetch allocations for all filters using the new endpoint
      const response = await fetch(`http://localhost:8080/project-details-all/${clientId}/${projectId}`);
      if (response.ok) {
        const data = await response.json();
        console.log('Excel Download Data:', data); // Add this line for debugging
        const { clientName, projectName, allocations } = data;

        // Create a new workbook
        const workbook = XLSX.utils.book_new();

        // Define the order and names of the sheets
        const sheetOrder = ['active', 'closed', 'all'];
        const sheetNames = {
          active: 'Active',
          closed: 'Closed',
          all: 'All'
        };

        sheetOrder.forEach((filterKey) => {
          const currentAllocations = allocations[filterKey];
          const sheetName = sheetNames[filterKey] || filterKey;

          // Prepare data for the sheet
          const worksheetData = currentAllocations.map((alloc) => ({
            'Employee Name': alloc.EmployeeName,
            'Role': alloc.EmployeeRole,
            'Allocation %': alloc.AllocationPercent,
            'Allocation Status': alloc.AllocationStatus,
            'Billing Type': alloc.AllocationBillingType,
            'Billed Check': alloc.AllocationBilledCheck,
            'Billing Rate': alloc.AllocationBillingRate,
            'TimeSheet Approver': alloc.AllocationTimeSheetApprover,
            'Start Date': alloc.AllocationStartDate,
            'End Date': alloc.AllocationEndDate || 'N/A',
            'Modified By': alloc.ModifiedBy,
            'Modified At': alloc.ModifiedAt
          }));

          // If there are no allocations for this filter, add a placeholder row
          if (worksheetData.length === 0) {
            worksheetData.push({ 'Message': 'No allocations found for this filter.' });
          }

          // Convert JSON to sheet
          const worksheet = XLSX.utils.json_to_sheet(worksheetData);

          // Append the sheet to the workbook
          XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
        });

        // Generate Excel buffer
        const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });

        // Create a blob from the buffer
        const dataBlob = new Blob([excelBuffer], { type: 'application/octet-stream' });

        // Define the filename with current date
        const currentDate = new Date().toISOString().split('T')[0];
        const filename = `${clientName}_${projectName}_Allocations_${currentDate}.xlsx`;

        // Trigger the download
        saveAs(dataBlob, filename);

        // Notify the user that the download has started
        setShowMessage(true);
        setTimeout(() => setShowMessage(false), 3000);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || `Error: ${response.status} ${response.statusText}`);
      }
    } catch (err) {
      console.error('Error during Excel download:', err);
      setError(err.message || 'Failed to download allocations. Please try again.');
    } finally {
      setIsDownloading(false); // End download process
    }
  };

  // Handle Allocation Submission
  const handleSubmit = () => {
    // Simulate adding a new employee to the list
    const newEmployee = { 
      EmployeeName: resourceName, 
      EmployeeRole: 'New Role', 
      AllocationPercent: parseFloat(allocationPercentage),
      AllocationStatus: 'Allocated',
      AllocationBillingType: 'Type A',
      AllocationBilledCheck: 'Yes',
      AllocationBillingRate: 100,
      AllocationTimeSheetApprover: 'Rajendra',
      AllocationStartDate: '2024-10-01',
      AllocationEndDate: '2024-12-31',
      ModifiedBy: 'Admin',
      ModifiedAt: new Date().toISOString()
    };
    setEmployeesData([...employeesData, newEmployee]);
    setShowMessage(true);
    setTimeout(() => setShowMessage(false), 3000);
    setOpen(false);
    setResourceName('');
    setAllocationPercentage('');
  };

  // Handle Back Click
  const handleBackClick = () => {
    navigate(-1);
  };

  return (
    <div className="main-layout">
      <div className='right-content'>
        {/* Breadcrumb Navigation */}
        <div className='breadcrumb'>
          {/* Back Arrow Icon */}
          <Icon 
            name="arrow left" 
            size="large" 
            className="icon"
            onClick={handleBackClick} 
            style={{ cursor: 'pointer' }}
          />
          
          {/* Previous Screen Link */}
          <h2 
            className="breadcrumb-text" 
            onClick={() => navigate('/clients')}
            style={{ cursor: 'pointer', display: 'inline', marginLeft: '10px' }}
          >
            Clients
          </h2>
          
          {/* Divider between breadcrumb items */}
          <span className="breadcrumb-divider"> / </span>
          
          {/* Current Client Name */}
          <h2 
            className="breadcrumb-text" 
            onClick={() => navigate(`/client/${clientId}/projects`)}
            style={{ cursor: 'pointer', display: 'inline', marginLeft: '10px' }}
          >
            {clientName || 'Loading...'}
          </h2>
          
          {/* Divider between breadcrumb items */}
          <span className="breadcrumb-divider"> / </span>
          
          {/* Current Project Name */}
          <h2 className="breadcrumb-text" style={{ display: 'inline' }}>
            {projectName || 'Loading...'}
          </h2>
        </div>

        {/* Control Buttons */}
        <div className='controls' style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          {/* Filter Tabs */}
          <div className="filter-tabs" style={{ display: 'flex', gap: '10px', flexGrow: 1 }}>
            <button
              className={`tab ${filter === 'active' ? 'active' : ''}`}
              onClick={() => handleFilterChange('active')}
            >
              Active
            </button>
            <button
              className={`tab ${filter === 'closed' ? 'active' : ''}`}
              onClick={() => handleFilterChange('closed')}
            >
              Closed
            </button>
            <button
              className={`tab ${filter === 'all' ? 'active' : ''}`}
              onClick={() => handleFilterChange('all')}
            >
              All
            </button>
          </div>

          {/* Download and Allocate Buttons */}
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            
            {userRole === 'bizops' && (
              <Button 
                positive 
                icon="plus" 
                onClick={() => setOpen(true)} 
                content="Allocate Resource" 
              />
            )}
            <Button
              icon
              labelPosition="left"
              color="blue"
              onClick={downloadExcel}
              className="download-button"
              disabled={isDownloading} // Disable button during download
            >
              {isDownloading ? (
                <>
                  <Loader active inline size='small' /> Downloading...
                </>
              ) : (
                <>
                  <Icon name="download" />
                  Download
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Display Success Message */}
        {showMessage && (
          <Message
            success
            header='Success'
            content='Excel file is being downloaded.'
            onDismiss={() => setShowMessage(false)}
          />
        )}

        {/* Display Error Message */}
        {error && (
          <Message
            negative
            header='Error'
            content={error}
            onDismiss={() => setError(null)}
          />
        )}

        {/* Allocations Table */}
        <div className='table-container'>
          {loading ? (
            <Loader active inline='centered' size='large'>
              Loading allocations...
            </Loader>
          ) : (
            <Table celled sortable>
              <Table.Header>
                <Table.Row>
                  <Table.HeaderCell
                    sorted={sortConfig.key === 'EmployeeName' ? sortConfig.direction : null}
                    onClick={() => handleSort('EmployeeName')}
                  >
                    Employee Name
                  </Table.HeaderCell>
                  <Table.HeaderCell
                    sorted={sortConfig.key === 'EmployeeRole' ? sortConfig.direction : null}
                    onClick={() => handleSort('EmployeeRole')}
                  >
                    Role
                  </Table.HeaderCell>
                  <Table.HeaderCell
                    sorted={sortConfig.key === 'AllocationPercent' ? sortConfig.direction : null}
                    onClick={() => handleSort('AllocationPercent')}
                  >
                    Allocation %
                  </Table.HeaderCell>
                  <Table.HeaderCell
                    sorted={sortConfig.key === 'AllocationStatus' ? sortConfig.direction : null}
                    onClick={() => handleSort('AllocationStatus')}
                  >
                    Allocation Status
                  </Table.HeaderCell>
                  <Table.HeaderCell
                    sorted={sortConfig.key === 'AllocationBillingType' ? sortConfig.direction : null}
                    onClick={() => handleSort('AllocationBillingType')}
                  >
                    Billing Type
                  </Table.HeaderCell>
                  <Table.HeaderCell
                    sorted={sortConfig.key === 'AllocationBilledCheck' ? sortConfig.direction : null}
                    onClick={() => handleSort('AllocationBilledCheck')}
                  >
                    Billed Check
                  </Table.HeaderCell>
                  <Table.HeaderCell
                    sorted={sortConfig.key === 'AllocationBillingRate' ? sortConfig.direction : null}
                    onClick={() => handleSort('AllocationBillingRate')}
                  >
                    Billing Rate
                  </Table.HeaderCell>
                  <Table.HeaderCell
                    sorted={sortConfig.key === 'AllocationTimeSheetApprover' ? sortConfig.direction : null}
                    onClick={() => handleSort('AllocationTimeSheetApprover')}
                  >
                    TimeSheet Approver
                  </Table.HeaderCell>
                  <Table.HeaderCell
                    sorted={sortConfig.key === 'AllocationStartDate' ? sortConfig.direction : null}
                    onClick={() => handleSort('AllocationStartDate')}
                  >
                    Start Date
                  </Table.HeaderCell>
                  <Table.HeaderCell
                    sorted={sortConfig.key === 'AllocationEndDate' ? sortConfig.direction : null}
                    onClick={() => handleSort('AllocationEndDate')}
                  >
                    End Date
                  </Table.HeaderCell>
                  <Table.HeaderCell
                    sorted={sortConfig.key === 'ModifiedBy' ? sortConfig.direction : null}
                    onClick={() => handleSort('ModifiedBy')}
                  >
                    Modified By
                  </Table.HeaderCell>
                  <Table.HeaderCell
                    sorted={sortConfig.key === 'ModifiedAt' ? sortConfig.direction : null}
                    onClick={() => handleSort('ModifiedAt')}
                  >
                    Modified At
                  </Table.HeaderCell>
                </Table.Row>
              </Table.Header>


              <Table.Body>
                {sortedData.length > 0 ? (
                  sortedData.map((employee, index) => (
                    <Table.Row key={index}>
                      <Table.Cell>
                        <Icon name="user" /> {employee.EmployeeName || 'N/A'}
                      </Table.Cell>
                      <Table.Cell>{employee.EmployeeRole || 'N/A'}</Table.Cell>
                      <Table.Cell>{employee.AllocationPercent}%</Table.Cell>
                      <Table.Cell>{employee.AllocationStatus}</Table.Cell>
                      <Table.Cell>{employee.AllocationBillingType}</Table.Cell>
                      <Table.Cell>{employee.AllocationBilledCheck}</Table.Cell>
                      <Table.Cell>${employee.AllocationBillingRate.toFixed(2)}</Table.Cell>
                      <Table.Cell>{employee.AllocationTimeSheetApprover}</Table.Cell>
                      <Table.Cell>{new Date(employee.AllocationStartDate).toLocaleDateString()}</Table.Cell>
                      <Table.Cell>{employee.AllocationEndDate ? new Date(employee.AllocationEndDate).toLocaleDateString() : 'N/A'}</Table.Cell>
                      <Table.Cell>{employee.ModifiedBy}</Table.Cell>
                      <Table.Cell>{new Date(employee.ModifiedAt).toLocaleString()}</Table.Cell>
                    </Table.Row>
                  ))
                ) : (
                  <Table.Row>
                    <Table.Cell colSpan="12" textAlign="center">
                      {error ? error : 'No allocations found.'}
                    </Table.Cell>
                  </Table.Row>
                )}
              </Table.Body>
            </Table>
          )}
        </div>

        {/* Allocate Resource Modal */}
        <Modal
          open={open}
          onClose={() => setOpen(false)}
          size="small"
          dimmer="blurring"
        >
          <Modal.Header>
            Allocate Resource
            <Icon 
              name="close" 
              size="large"
              style={{ float: 'right', cursor: 'pointer' }} 
              onClick={() => setOpen(false)} 
            />
          </Modal.Header>
          <Modal.Content>
            <Form>
              <Form.Field required>
                <label>Employee Name</label>
                <Dropdown
                  placeholder="Select Employee"
                  fluid
                  selection
                  options={employeeOptions}
                  value={resourceName}
                  onChange={(e, { value }) => setResourceName(value)}
                />
              </Form.Field>
              <Form.Field required>
                <label>Allocation %</label>
                <Form.Input
                  type="number"
                  placeholder="Enter allocation percentage"
                  value={allocationPercentage}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value);
                    if (value >= 0 && value <= 100) {
                      setAllocationPercentage(value);
                    }
                  }}
                  min={0}
                  max={100}
                />
              </Form.Field>
            </Form>
          </Modal.Content>
          <Modal.Actions>
            <Button negative onClick={() => setOpen(false)}>
              <IoMdClose size={20} /> Cancel
            </Button>
            <Button 
              positive 
              onClick={handleSubmit}
              disabled={!resourceName || allocationPercentage === ''}
            >
              <MdCheck size={20} /> Allocate
            </Button>
          </Modal.Actions>
        </Modal>
      </div>
    </div>
  );
};

export default ClientDetails;
