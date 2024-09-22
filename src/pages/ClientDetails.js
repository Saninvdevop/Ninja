import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Table, Icon, Button, Modal, Form, Dropdown, Popup, Message } from 'semantic-ui-react';
import './ClientDetails.css'; // Custom CSS for styling
import { IoSaveOutline } from "react-icons/io5"; // Import Save Icon
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

  // Remove the previous clientName and projectName derivation
  // const clientName = clientId.replace('-', ' ').replace(/\b\w/g, (char) => char.toUpperCase());
  // const projectName = projectId.replace('-', ' ').replace(/\b\w/g, (char) => char.toUpperCase());

  // Placeholder employee options
  const employeeOptions = [
    { key: 1, text: 'Alice Johnson', value: 'Alice Johnson' },
    { key: 2, text: 'Bob Williams', value: 'Bob Williams' },
    // Add more placeholder options as needed
  ];

  // Fetch allocations from the backend API
  const fetchAllocations = async (currentFilter) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`http://localhost:8080/project-details/${clientId}/${projectId}?filter=${currentFilter}`);
      if (response.ok) {
        const data = await response.json();
        setClientName(data.clientName);
        setProjectName(data.projectName);
        setEmployeesData(data.allocations);
      } else if (response.status === 404) {
        // Handle 404 by assuming no allocations found
        setClientName('Unknown Client'); // Or handle appropriately
        setProjectName('Unknown Project'); // Or handle appropriately
        setEmployeesData([]); // Clear allocations
      } else {
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }
    } catch (err) {
      console.error('Fetch error:', err);
      setError('Failed to load allocations');
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

  // Handle Download Excel
  const downloadExcel = () => {
    if (employeesData.length === 0) {
      // Optionally, notify user that there's no data to download
      return;
    }

    // Prepare data for Excel
    const worksheetData = sortedData.map((alloc) => ({
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

    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, `${filter.charAt(0).toUpperCase() + filter.slice(1)}`);
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const data = new Blob([excelBuffer], { type: 'application/octet-stream' });
    saveAs(data, `${clientName}_${projectName}_Allocations_${filter.charAt(0).toUpperCase() + filter.slice(1)}.xlsx`);
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
            onClick={() => navigate(`/clients/${clientId}`)}
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
        <div className='controls'>
          {/* Filter Tabs */}
          <div className="filter-tabs">
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
            <Button
              icon
              labelPosition="left"
              color="blue"
              onClick={downloadExcel}
              className="download-button"
            >
              <Icon name="download" />
              Download
            </Button>
            {userRole === 'bizops' && (
              <Button 
                positive 
                icon="plus" 
                onClick={() => setOpen(true)} 
                content="Allocate Resource" 
              />
            )}
          </div>
        </div>

        {/* Display Success Message */}
        {showMessage && (
          <Message
            success
            header='Success'
            content='Resource allocated successfully!'
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
        <div className='table'>
          {loading ? (
            <p>Loading allocations...</p>
          ) : (
            <Table celled striped sortable>
              <Table.Header>
                <Table.Row>
                  <Table.HeaderCell
                    sorted={sortConfig.key === 'EmployeeName' ? sortConfig.direction : null}
                    onClick={() => handleSort('EmployeeName')}
                  >
                    Employee Name <Icon name="sort" />
                  </Table.HeaderCell>
                  <Table.HeaderCell
                    sorted={sortConfig.key === 'EmployeeRole' ? sortConfig.direction : null}
                    onClick={() => handleSort('EmployeeRole')}
                  >
                    Role <Icon name="sort" />
                  </Table.HeaderCell>
                  <Table.HeaderCell
                    sorted={sortConfig.key === 'AllocationPercent' ? sortConfig.direction : null}
                    onClick={() => handleSort('AllocationPercent')}
                  >
                    Allocation % <Icon name="sort" />
                  </Table.HeaderCell>
                  <Table.HeaderCell
                    sorted={sortConfig.key === 'AllocationStatus' ? sortConfig.direction : null}
                    onClick={() => handleSort('AllocationStatus')}
                  >
                    Allocation Status <Icon name="sort" />
                  </Table.HeaderCell>
                  <Table.HeaderCell
                    sorted={sortConfig.key === 'AllocationBillingType' ? sortConfig.direction : null}
                    onClick={() => handleSort('AllocationBillingType')}
                  >
                    Billing Type <Icon name="sort" />
                  </Table.HeaderCell>
                  <Table.HeaderCell
                    sorted={sortConfig.key === 'AllocationBilledCheck' ? sortConfig.direction : null}
                    onClick={() => handleSort('AllocationBilledCheck')}
                  >
                    Billed Check <Icon name="sort" />
                  </Table.HeaderCell>
                  <Table.HeaderCell
                    sorted={sortConfig.key === 'AllocationBillingRate' ? sortConfig.direction : null}
                    onClick={() => handleSort('AllocationBillingRate')}
                  >
                    Billing Rate <Icon name="sort" />
                  </Table.HeaderCell>
                  <Table.HeaderCell
                    sorted={sortConfig.key === 'AllocationTimeSheetApprover' ? sortConfig.direction : null}
                    onClick={() => handleSort('AllocationTimeSheetApprover')}
                  >
                    TimeSheet Approver <Icon name="sort" />
                  </Table.HeaderCell>
                  <Table.HeaderCell
                    sorted={sortConfig.key === 'AllocationStartDate' ? sortConfig.direction : null}
                    onClick={() => handleSort('AllocationStartDate')}
                  >
                    Start Date <Icon name="sort" />
                  </Table.HeaderCell>
                  <Table.HeaderCell
                    sorted={sortConfig.key === 'AllocationEndDate' ? sortConfig.direction : null}
                    onClick={() => handleSort('AllocationEndDate')}
                  >
                    End Date <Icon name="sort" />
                  </Table.HeaderCell>
                  <Table.HeaderCell
                    sorted={sortConfig.key === 'ModifiedBy' ? sortConfig.direction : null}
                    onClick={() => handleSort('ModifiedBy')}
                  >
                    Modified By <Icon name="sort" />
                  </Table.HeaderCell>
                  <Table.HeaderCell
                    sorted={sortConfig.key === 'ModifiedAt' ? sortConfig.direction : null}
                    onClick={() => handleSort('ModifiedAt')}
                  >
                    Modified At <Icon name="sort" />
                  </Table.HeaderCell>
                </Table.Row>
              </Table.Header>

              <Table.Body>
                {sortedData.length > 0 ? (
                  sortedData.map((employee, index) => (
                    <Table.Row key={index}>
                      <Table.Cell>
                        <Icon name="user" /> {employee.EmployeeName}
                      </Table.Cell>
                      <Table.Cell>{employee.EmployeeRole}</Table.Cell>
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
              disabled={!resourceName || !allocationPercentage}
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
