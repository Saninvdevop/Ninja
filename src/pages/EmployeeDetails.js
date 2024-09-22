import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Icon, Table, Button, Modal, Form, Dropdown, Popup } from 'semantic-ui-react';
import './EmployeeDetails.css';
import { IoSaveOutline } from "react-icons/io5"; // Import Save Icon
import { IoMdClose } from "react-icons/io"; // Import Discard Icon
import { MdCheck } from "react-icons/md";
import AllocationDonutChart from '../components/AllocationDonutChart/Allocationdonutchart';
import * as XLSX from 'xlsx'; // Import SheetJS
import { saveAs } from 'file-saver'; // Import FileSaver

const EmployeeDetails = ({ userRole }) => {  // Accept userRole as a prop
  const { id } = useParams(); 
  const [error, setError] = useState(null);
  const navigate = useNavigate(); // Initialize useNavigate for navigation
  
  const [employeeData, setEmployeeData] = useState(null); // State for employee details
  const [allocations, setAllocations] = useState([]); // Allocations data
  const [clientData, setClientData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [projectOptions, setProjectOptions] = useState([]);
  const [open, setOpen] = useState(false);
  const [sortColumn, setSortColumn] = useState(null);
  const [sortDirection, setSortDirection] = useState(null); 
  const [newAllocation, setNewAllocation] = useState({
    employeeName: '',
    employeeId: '',
    clientName: '',
    projectName: '',
    status: '',
    allocation: '',
    startDate: '',
    endDate: '',
    billingRate: '',
    timeSheetApprover: '',
  });

  const [filter, setFilter] = useState('active'); // Set default filter to 'active'
  const [currentAllocation, setCurrentAllocation] = useState(0); // State for current allocation percentage

  // Add the handleDownloadExcel function
  const handleDownloadExcel = async () => {
    if (!employeeData) return; // Ensure employee data is available

    try {
      // Define the filters
      const filters = ['active', 'closed', 'all'];
      
      // Prepare an array of fetch promises
      const fetchPromises = filters.map(filterType =>
        fetch(`http://localhost:8080/employee-details/${id}/allocations?filter=${filterType}`)
          .then(response => {
            if (!response.ok) {
              throw new Error(`Failed to fetch ${filterType} allocations`);
            }
            return response.json();
          })
      );

      // Wait for all fetches to complete
      const results = await Promise.all(fetchPromises);

      // Create a new workbook
      const workbook = XLSX.utils.book_new();

      // Map each result to its corresponding filter
      results.forEach((data, index) => {
        const filterType = filters[index];
        const sheetName = filterType.charAt(0).toUpperCase() + filterType.slice(1); // Capitalize first letter

        // Convert allocations data to worksheet
        const worksheetData = data.allocations.map(alloc => ({
          'Allocation ID': alloc.AllocationID,
          'Client ID': alloc.ClientID,
          'Client Name': alloc.ClientName, // Added ClientName
          'Project ID': alloc.ProjectID,
          'Project Name': alloc.ProjectName, // Added ProjectName
          'Allocation Status': alloc.AllocationStatus,
          'Allocation %': alloc.AllocationPercent,
          'Billing Type': alloc.AllocationBillingType,
          'Billed Check': alloc.AllocationBilledCheck,
          'Billing Rate': alloc.AllocationBillingRate,
          'TimeSheet Approver': alloc.AllocationTimeSheetApprover,
          'Start Date': alloc.AllocationStartDate,
          'End Date': alloc.AllocationEndDate,
          'Modified By': alloc.ModifiedBy,
          'Modified At': alloc.ModifiedAt,
        }));

        const worksheet = XLSX.utils.json_to_sheet(worksheetData);

        // Append worksheet to workbook with the sheet name
        XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
      });

      // Generate buffer
      const workbookOut = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });

      // Create a Blob from the buffer
      const blob = new Blob([workbookOut], { type: 'application/octet-stream' });

      // Trigger the download using FileSaver
      saveAs(blob, `${employeeData.EmployeeName}_Allocations.xlsx`);
    } catch (error) {
      console.error('Error during Excel download:', error);
      setError('Failed to download allocations');
    }
  };


  // Fetch client data from API
  useEffect(() => {
    const fetchClientData = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://localhost:5000/clients');
        
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }

        const data = await response.json();
        setClientData(data);
        
      } catch (error) {
        console.error('Fetch error:', error);
        setError('Failed to load client data');
      } finally {
        setLoading(false);
      }
    };

    fetchClientData();
  }, []);

  // Fetch employee data from API
  const fetchEmployeeData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:8080/employee-details/${id}`);
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const data = await response.json();
      setEmployeeData(data);
      // Allocations are fetched separately
    } catch (error) {
      console.error('Fetch error:', error);
      setError('Failed to load employee data');
    } finally {
      setLoading(false);
    }
  };

  // Fetch allocations based on filter
  const fetchAllocations = async (currentFilter) => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:8080/employee-details/${id}/allocations?filter=${currentFilter}`);
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const data = await response.json();
      setAllocations(data.allocations);
      setCurrentAllocation(data.currentAllocation);
    } catch (error) {
      console.error('Fetch error:', error);
      setError('Failed to load allocations');
    } finally {
      setLoading(false);
    }
  };

  // Fetch employee data and allocations on component mount and when filter changes
  useEffect(() => {
    fetchEmployeeData();
    fetchAllocations(filter);
  }, [id, filter]);

  // Options for client dropdown
  const clientOptions = clientData.map((client) => ({
    key: client.ClientID,
    text: client.ClientName,
    value: client.ClientName, // Using client name as value to match table entries
  }));

  // Sorting function
  const handleSort = (column) => {
    let direction = 'ascending';
    if (sortColumn === column && sortDirection === 'ascending') {
      direction = 'descending';
    }
    const sortedData = [...allocations].sort((a, b) => {
      if (a[column] === null) return 1;
      if (b[column] === null) return -1;
      if (a[column] === b[column]) return 0;
      if (direction === 'ascending') {
        return a[column] > b[column] ? 1 : -1;
      }
      return a[column] < b[column] ? 1 : -1;
    });
    setAllocations(sortedData);
    setSortColumn(column);
    setSortDirection(direction);
  };

  // Render sorting indicator
  const renderSortIcon = (column) => {
    if (sortColumn !== column) return null;
    if (sortDirection === 'ascending') {
      return <Icon name="sort up" />;
    } else {
      return <Icon name="sort down" />;
    }
  };

  // State to manage selected client and project
  const [selectedClient, setSelectedClient] = useState('');
  // State to manage the currently edited allocation
  const [editIndex, setEditIndex] = useState(null);

  // Fetch project options based on selected client
  useEffect(() => {
    const fetchProjects = async (clientName) => {
      try {
        if (clientName) {
          const response = await fetch(`http://localhost:5000/client/${clientName}/allprojects`);
          if (!response.ok) {
            throw new Error('Network response was not ok');
          }
          const projects = await response.json();
          const projectOptions = projects.map(project => ({
            key: project.ProjectName,
            text: project.ProjectName,
            value: project.ProjectName,
          }));
          setProjectOptions([{ key: 'none', text: 'None', value: '' }, ...projectOptions]);
        } else {
          setProjectOptions([{ key: 'none', text: 'None', value: '' }]);
        }
      } catch (error) {
        setError('Failed to load projects');
        console.error('Fetch error:', error);
      }
    };

    fetchProjects(newAllocation.clientName);
  }, [newAllocation.clientName]);

  // Function to handle client change and update project options
  const handleClientChange = (e, { value }) => {
    setNewAllocation(prev => ({
      ...prev,
      clientName: value,
      projectName: '',
      status: !prev.projectName ? 'Client Unallocated' : prev.status,
    }));
    setSelectedClient(value);
  };
  
  const submitAllocation = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/allocate', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          EmployeeID: newAllocation.employeeId,
          ClientName: newAllocation.clientName,
          ProjectName: newAllocation.projectName,
          AllocationPercent: newAllocation.allocation,
          AllocationStatus: newAllocation.status,
          AllocationStartDate: newAllocation.startDate,
          AllocationEndDate: newAllocation.endDate,
          AllocationTimeSheetApprover: newAllocation.timeSheetApprover,
          AllocationBillingRate: newAllocation.billingRate,
          ModifiedBy: 'Admin', // Adjust as needed
        }),
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const data = await response.json();
      console.log('Allocation saved successfully:', data);
      setError(null); // Clear any previous errors
    } catch (error) {
      console.error('Error saving allocation:', error);
      setError('Failed to save allocation');
    }
  };

  const handleSaveAllocation = async () => {
    if (editIndex !== null) {
      // Edit existing allocation
      const updatedAllocations = [...allocations];
      updatedAllocations[editIndex] = { ...newAllocation, AllocationPercent: parseInt(newAllocation.allocation) };
      setAllocations(updatedAllocations);
    } else {
      // Add new allocation
      setAllocations([
        ...allocations,
        {
          ...newAllocation,
          AllocationPercent: parseInt(newAllocation.allocation),
        },
      ]);
    }

    // Send data to backend
    await submitAllocation();

    // Fetch updated data to refresh UI
    fetchAllocations(filter);

    // Clear form fields after saving
    setNewAllocation({
      employeeName: '',
      employeeId: '',
      clientName: '',
      projectName: '',
      status: '',
      allocation: '',
      startDate: '',
      endDate: '',
      billingRate: '',
      timeSheetApprover: '',
    });

    setSelectedClient('');
    setProjectOptions([]);
    setOpen(false);
    setEditIndex(null);
  };

  // Function to handle deletion of an allocation
  const handleDeleteAllocation = async (allocationId) => {
    try {
      const response = await fetch(`http://localhost:5000/allocations/${allocationId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      // Remove the allocation from state
      setAllocations(prevAllocations => prevAllocations.filter(alloc => alloc.AllocationID !== allocationId));
      setError(null); // Clear any previous errors
    } catch (error) {
      console.error('Error deleting allocation:', error);
      setError('Failed to delete allocation');
    }
  };

  // Function to handle edit button click
  const handleEditAllocation = (allocationId) => {
    const allocationToEdit = allocations.find(alloc => alloc.AllocationID === allocationId);
    if (!allocationToEdit) {
      setError('Allocation not found');
      return;
    }

    setNewAllocation({
      employeeName: employeeData.EmployeeName,
      employeeId: employeeData.EmployeeId,
      clientName: allocationToEdit.ClientName,
      projectName: allocationToEdit.ProjectName,
      status: allocationToEdit.AllocationStatus,
      allocation: allocationToEdit.AllocationPercent.toString(),
      startDate: allocationToEdit.AllocationStartDate,
      endDate: allocationToEdit.AllocationEndDate,
      billingRate: allocationToEdit.AllocationBillingRate.toString(),
      timeSheetApprover: allocationToEdit.AllocationTimeSheetApprover,
    });
    setSelectedClient(allocationToEdit.ClientName);
    const editIndex = allocations.findIndex(alloc => alloc.AllocationID === allocationId);
    setEditIndex(editIndex);

    // Fetch projects for the selected client
    const fetchProjectsForEdit = async () => {
      try {
        const response = await fetch(`http://localhost:5000/client/${allocationToEdit.ClientName}/allprojects`);
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        const projects = await response.json();
        const projectOptions = projects.map(project => ({
          key: project.ProjectName,
          text: project.ProjectName,
          value: project.ProjectName,
        }));
        setProjectOptions([{ key: 'none', text: 'None', value: '' }, ...projectOptions]);
      } catch (error) {
        setError('Failed to load projects');
        console.error('Fetch error:', error);
      }
    };

    fetchProjectsForEdit();

    setOpen(true); // Open the modal
  };

  // Calculate total allocation percentage based on allocations data
  const calculateTotalAllocationPercentage = () => {
    return allocations.reduce((total, alloc) => total + parseFloat(alloc.AllocationPercent || 0), 0);
  };

  const totalAllocationPercentage = calculateTotalAllocationPercentage();
  // Data for the donut chart
  const dataValues = [currentAllocation, 100 - currentAllocation];
  const colors =
    currentAllocation === 100
      ? ['#77dd77', '#e0e0e0'] // Green if 100% allocated
      : currentAllocation === 0
      ? ['#FF0000', '#e0e0e0'] // Red if 0% allocated
      : ['#FFA500', '#e0e0e0']; // Orange for partial allocation

  const labels = ['Allocated', 'Unallocated'];

  // Function to handle submission when doughnut chart turns into a button
  const handleSubmit = () => {
    alert('All allocations submitted successfully!');
  };

  // Function to open the modal and set the pre-filled values
  const handleOpenModal = () => {
    setNewAllocation({
      employeeName: employeeData ? employeeData.EmployeeName : '',
      employeeId: employeeData ? employeeData.EmployeeId : '',
      clientName: '',
      projectName: '',
      status: '',
      allocation: '',
      startDate: '',
      endDate: '',
      billingRate: '',
      timeSheetApprover: '',
    });
    setEditIndex(null); // Reset edit index
    setOpen(true); // Open the modal
  };

  const handleProjectChange = (e, { value }) => {
    setNewAllocation(prev => ({
      ...prev,
      projectName: value,
      status: newAllocation.clientName && value && (!newAllocation.allocation || newAllocation.allocation === '0')
        ? 'Project Unallocated'
        : newAllocation.clientName && value && newAllocation.allocation && newAllocation.allocation !== '0'
        ? 'Allocated'
        : newAllocation.clientName && !newAllocation.projectName
        ? 'Client Unallocated'
        : prev.status,
    }));
  };

  // Check if all fields are filled in the modal form
  const isFormValid = () => {
    return (
      newAllocation.clientName &&
      newAllocation.projectName &&
      newAllocation.status &&
      newAllocation.allocation &&
      newAllocation.startDate &&
      newAllocation.endDate &&
      newAllocation.billingRate &&
      newAllocation.timeSheetApprover
    );
  };

  const handleBackClick = () => {
    navigate(-1); // Go back to the previous page
  };

  // Render the button based on allocation percentage
  const renderActionButton = () => {
    if (currentAllocation === 100) {
      // Render Submit button if allocation is 100%
      return (
        <Popup
          content="Submit Allocations"
          trigger={
            <Button
              style={{ backgroundColor: 'green', color: 'white' }}
              icon={<MdCheck size={24} />}
              onClick={handleSubmit}
            />
          }
        />
      );
    } else {
      // Render Save to Draft button if allocation is not 100%
      return (
        <Popup
          content="Save to Draft"
          trigger={
            <Button
              style={{ backgroundColor: 'black', color: 'white' }}
              icon={<IoSaveOutline size={24} />}
              onClick={handleSubmit}
            />
          }
        />
      );
    }
  };

  // Helper function to generate default image based on employee name
  const getDefaultImage = (name) => {
    if (!name) return 'https://via.placeholder.com/150';
    const firstChar = name.charAt(0).toUpperCase();
    // Replace this URL with your logic to generate images based on the first character
    return `https://ui-avatars.com/api/?name=${firstChar}&background=random&size=150`;
  };

  return (
    <div className="main-layout">
      <div className='right-content'>
        <div className='breadcrumb'>
          {/* Back Arrow Icon */}
          <Icon 
            name="arrow left" 
            size="large" 
            className="icon"
            onClick={handleBackClick} 
          />
          
          {/* Previous Screen Link */}
          <h2 
            className="breadcrumb-text" 
            onClick={() => navigate('/employees')}
          >
            Employees
          </h2>
          
          {/* Divider between breadcrumb items */}
          <span className="breadcrumb-divider"> / </span>
          
          {/* Current Employee Name */}
          <h2 className="breadcrumb-text">
            {employeeData ? employeeData.EmployeeName : "Employee Details"}
          </h2>
          
          {/* Save and Discard Buttons (Right Aligned) */}
          <div className='breadcrumb-actions'>
            <Popup
              content="Discard Changes"
              trigger={
                <Button 
                  icon={<IoMdClose size={24} />} // Discard Icon
                  onClick={handleBackClick} 
                />
              }
            />
            {renderActionButton()}
          </div>
        </div>
        
        {loading && <p>Loading...</p>}
        {error && <p style={{ color: 'red' }}>{error}</p>}
        
        {!loading && employeeData && (
          <div className='middle-content'>
            <div className="employee-card">
              <div className="card-header">
                {/* Employee Image or Default Image */}
                <img 
                  src={employeeData.EmployeePhotoDetails ? employeeData.EmployeePhotoDetails : getDefaultImage(employeeData.EmployeeName)} 
                  alt="Employee Profile" 
                  className="profile-img" 
                />
                <div className="employee-info">
                  {/* Employee Name */}
                  <h2>{employeeData.EmployeeName}</h2>
                  {/* Employee ID */}
                  <p className="employee-id">ID: {employeeData.EmployeeId}</p>
                </div>
                {/* Info Icon with Popup */}
                <Popup
                  trigger={<i className="info icon" style={{ cursor: 'pointer', fontSize: '1.5em' }} />}
                  content={
                    <div>
                      <p><strong>Joining Date:</strong> {new Date(employeeData.EmployeeJoiningDate).toLocaleDateString()}</p>
                      <p><strong>Ending Date:</strong> {employeeData.EmployeeEndingDate ? new Date(employeeData.EmployeeEndingDate).toLocaleDateString() : 'N/A'}</p>
                      <p><strong>TYOE:</strong> {employeeData.EmployeeTYOE} {employeeData.EmployeeRole}</p>
                      <p><strong>Skills:</strong> {employeeData.EmployeeSkills}</p>
                      <p><strong>Contract Type:</strong> {employeeData.EmployeeContractType}</p>
                    </div>
                  }
                  position="top right"
                  on="click" // Click to show the popup
                />
              </div>

              <div className="top-info">
                <div className="info-item">
                  <Icon name="briefcase" size="large" />
                  <div>
                    <p>Role</p>
                    {/* Employee Role */}
                    <p>{employeeData.EmployeeRole}</p>
                  </div>
                </div>

                <div className="info-item">
                  <Icon name="building" size="large" />
                  <div>
                    <p>Studio</p>
                    {/* Employee Studio */}
                    <p>{employeeData.EmployeeStudio}</p>
                  </div>
                </div>

                <div className="info-item">
                  <Icon name="chart line" size="large" />
                  <div>
                    <p>Sub-studio</p>
                    {/* Employee Sub-Studio */}
                    <p>{employeeData.EmployeeSubStudio}</p>
                  </div>
                </div>
                <div className="info-item">
                  <Icon name="mail" size="large" />
                  <div>
                    <p>Email</p>
                    {/* Employee Email */}
                    <p>{employeeData.EmployeeEmail}</p>
                  </div>
                </div>

                <div className="info-item">
                  <Icon name="phone" size="large" />
                  <div>
                    <p>Keka Status</p>
                    {/* Employee Keka Status */}
                    <p>{employeeData.EmployeeKekaStatus}</p>
                  </div>
                </div>

                <div className="info-item">
                  <Icon name="map marker alternate" size="large" />
                  <div>
                    <p>Location</p>
                    {/* Employee Location */}
                    <p>{employeeData.EmployeeLocation}</p>
                  </div>
                </div>
              </div>
              {/* Buttons Section */}
              <div className="button-section">
                <Button primary icon="download" content="Download" onClick={handleDownloadExcel}/>
                {userRole === 'bizops' && (
                  <Button positive icon="plus" onClick={handleOpenModal} content="Allocate Resource" />
                )}
              </div>
            </div>
            <div className="allocation-chart">
              <AllocationDonutChart 
                total={currentAllocation} 
                dataValues={dataValues} 
                labels={labels} 
                colors={colors}
              />
            </div>
          </div>
        )}
        
        {!loading && employeeData && (
          <div className="bottom-content">
            <div className='table-filter-layout'>
              {/* Filter Tabs */}
              <div className="filter-tabs">
                <button
                  className={`tab ${filter === 'active' ? 'active' : ''}`}
                  onClick={() => setFilter('active')}
                >
                  Active
                </button>
                <button
                  className={`tab ${filter === 'closed' ? 'active' : ''}`}
                  onClick={() => setFilter('closed')}
                >
                  Closed
                </button>
                <button
                  className={`tab ${filter === 'all' ? 'active' : ''}`}
                  onClick={() => setFilter('all')}
                >
                  All
                </button>
              </div>
            </div>
            <div className='table-container'> {/* Add a container for horizontal scrolling */}
              <Table celled sortable>
                <Table.Header>
                  <Table.Row>
                    <Table.HeaderCell onClick={() => handleSort('AllocationID')}>
                      Allocation ID {renderSortIcon('AllocationID')}
                    </Table.HeaderCell>
                    <Table.HeaderCell onClick={() => handleSort('ClientID')}>
                      Client ID {renderSortIcon('ClientID')}
                    </Table.HeaderCell>
                    <Table.HeaderCell onClick={() => handleSort('ClientName')}>
                      Client Name {renderSortIcon('ClientName')}
                    </Table.HeaderCell>
                    <Table.HeaderCell onClick={() => handleSort('ProjectID')}>
                      Project ID {renderSortIcon('ProjectID')}
                    </Table.HeaderCell>
                    <Table.HeaderCell onClick={() => handleSort('ProjectName')}>
                      Project Name {renderSortIcon('ProjectName')}
                    </Table.HeaderCell>
                    <Table.HeaderCell onClick={() => handleSort('AllocationStatus')}>
                      Allocation Status {renderSortIcon('AllocationStatus')}
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
                      TimeSheet Approver {renderSortIcon('AllocationTimeSheetApprover')}
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
                    <Table.HeaderCell>Actions</Table.HeaderCell>
                  </Table.Row>
                </Table.Header>

                <Table.Body>
                  {allocations.length > 0 ? (
                    allocations.map((alloc) => (
                      <Table.Row key={alloc.AllocationID}>
                        <Table.Cell>{alloc.AllocationID}</Table.Cell>
                        <Table.Cell>{alloc.ClientID}</Table.Cell>
                        <Table.Cell>{alloc.ClientName}</Table.Cell> {/* Display ClientName */}
                        <Table.Cell>{alloc.ProjectID}</Table.Cell>
                        <Table.Cell>{alloc.ProjectName}</Table.Cell> {/* Display ProjectName */}
                        <Table.Cell>{alloc.AllocationStatus}</Table.Cell>
                        <Table.Cell>{alloc.AllocationPercent}%</Table.Cell>
                        <Table.Cell>{alloc.AllocationBillingType}</Table.Cell>
                        <Table.Cell>{alloc.AllocationBilledCheck}</Table.Cell>
                        <Table.Cell>${alloc.AllocationBillingRate.toFixed(2)}</Table.Cell>
                        <Table.Cell>{alloc.AllocationTimeSheetApprover}</Table.Cell>
                        <Table.Cell>{new Date(alloc.AllocationStartDate).toLocaleDateString()}</Table.Cell>
                        <Table.Cell>{alloc.AllocationEndDate ? new Date(alloc.AllocationEndDate).toLocaleDateString() : 'N/A'}</Table.Cell>
                        <Table.Cell>{alloc.ModifiedBy}</Table.Cell>
                        <Table.Cell>{new Date(alloc.ModifiedAt).toLocaleString()}</Table.Cell>
                        <Table.Cell>
                          <Button icon="edit" onClick={() => handleEditAllocation(alloc.AllocationID)} />
                          <Button icon="trash" color="red" onClick={() => handleDeleteAllocation(alloc.AllocationID)} />
                        </Table.Cell>
                      </Table.Row>
                    ))
                  ) : (
                    <Table.Row>
                      <Table.Cell colSpan="16" textAlign="center"> {/* Updated colSpan to 16 to include new columns */}
                        No allocations found.
                      </Table.Cell>
                    </Table.Row>
                  )}
                </Table.Body>
              </Table>
            </div>
          </div>
        )}
      </div>
      {/* Modal for Adding or Editing Allocation */}
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        size="tiny"
        dimmer="blurring"
      >
        <Modal.Header>
          {editIndex !== null ? 'Edit Allocation' : 'Add New Allocation'}
          <Icon 
            name="close" 
            size="25px"
            style={{ float: 'right', cursor: 'pointer' }} 
            onClick={() => setOpen(false)} 
          />
        </Modal.Header>
        <Modal.Content>
          <Form>
            <Form.Input
              label="Employee Name"
              placeholder="Enter employee name"
              value={newAllocation.employeeName}
              readOnly
            />
            <Form.Input
              label="Employee ID"
              placeholder="Enter employee ID"
              value={newAllocation.employeeId}
              readOnly
            />
            <Form.Field>
              <label>Client</label>
              <Dropdown
                placeholder="Select Client"
                fluid
                selection
                options={clientOptions}
                value={newAllocation.clientName}
                onChange={handleClientChange}
              />
            </Form.Field>
            <Form.Field>
              <label>Project</label>
              <Dropdown
                placeholder="Select Project"
                fluid
                selection
                options={
                  newAllocation.clientName === 'Innover' // If "Innover" is selected, set options to "Benched" only
                    ? [{ key: 'Benched', text: 'Benched', value: 'Benched' }]
                    : projectOptions // Otherwise, show all available options
                }
                value={newAllocation.projectName}
                onChange={handleProjectChange}
                disabled={newAllocation.clientName === 'Innover'} // Disable dropdown when client is "Innover"
              />
            </Form.Field>
            <Form.Field>
              <label>Status</label>
              <Dropdown
                placeholder="Select Status"
                fluid
                selection
                options={[
                  { key: 'client-unallocated', text: 'Client Unallocated', value: 'Client Unallocated' },
                  { key: 'project-unallocated', text: 'Project Unallocated', value: 'Project Unallocated' },
                  { key: 'allocated', text: 'Allocated', value: 'Allocated' },
                  { key: 'closed', text: 'Closed', value: 'Closed' }, // Added 'Closed' option
                ]}
                value={newAllocation.status}
                onChange={(e, { value }) => setNewAllocation({ ...newAllocation, status: value })}
                required
              />
            </Form.Field>
            <Form.Input
              label="Allocation %"
              type="number"
              placeholder="Enter allocation percentage"
              value={newAllocation.allocation}
              onChange={(e) => {
                // Parse the value and ensure it's between 0 and the remaining allocation
                let allocationValue = Math.max(0, Math.min(parseInt(e.target.value), 100 - currentAllocation)); 

                // Update the newAllocation state with the valid allocation value
                setNewAllocation((prev) => ({ ...prev, allocation: allocationValue.toString() }));

                // Update status based on conditions dynamically
                if (newAllocation.clientName && newAllocation.projectName && (!allocationValue || allocationValue === 0)) {
                  setNewAllocation((prev) => ({ ...prev, status: 'Project Unallocated' }));
                } else if (newAllocation.clientName && newAllocation.projectName && allocationValue && allocationValue !== 0) {
                  setNewAllocation((prev) => ({ ...prev, status: 'Allocated' }));
                } else if (newAllocation.clientName && !newAllocation.projectName) {
                  setNewAllocation((prev) => ({ ...prev, status: 'Client Unallocated' }));
                }
              }}
              min={0} // Prevent negative values
              max={100 - currentAllocation} // Set the maximum to the remaining allocation
              required
            />

            {/* Display remaining allocation */}
            {newAllocation.allocation && (
              <p style={{ color: 'gray', fontSize: '12px', marginTop: '5px' }}>
                {100 - currentAllocation - parseInt(newAllocation.allocation)}% allocation remaining.
              </p>
            )}

            <Form.Input
              label="Billing Rate (USD)"
              placeholder="Enter billing rate"
              type="number"
              value={newAllocation.billingRate}
              onChange={(e) => {
                // Ensure the billing rate is always non-negative
                const billingRate = Math.max(0, parseFloat(e.target.value));
                setNewAllocation((prev) => ({ ...prev, billingRate }));
              }}
              min={0} // Prevent negative values
              required
            />

            <Form.Field>
              <label>Time Sheet Approver</label>
              <Dropdown
                placeholder="Select Approver"
                fluid
                selection
                options={[
                  { key: 'rajendra', text: 'Rajendra', value: 'Rajendra' },
                  { key: 'kiran', text: 'Kiran', value: 'Kiran' },
                  { key: 'shishir', text: 'Shishir', value: 'Shishir' },
                ]}
                value={newAllocation.timeSheetApprover}
                onChange={(e, { value }) =>
                  setNewAllocation({ ...newAllocation, timeSheetApprover: value })
                }
                required
              />
            </Form.Field>
            <Form.Input
              label="Start Date"
              type="date"
              placeholder="Enter start date"
              value={newAllocation.startDate}
              onChange={(e) =>
                setNewAllocation({ ...newAllocation, startDate: e.target.value })
              }
              required
            />
            <Form.Input
              label="End Date"
              type="date"
              placeholder="Enter end date"
              value={newAllocation.endDate}
              onChange={(e) =>
                setNewAllocation({ ...newAllocation, endDate: e.target.value })
              }
              required
            />
          </Form>
        </Modal.Content>
        <Modal.Actions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button
            color="blue"
            onClick={handleSaveAllocation}
            disabled={!isFormValid()} // Disable if the form is not valid
          >
            {editIndex !== null ? 'Update' : 'Save'}
          </Button>
        </Modal.Actions>
      </Modal>
    </div>
  );
};

export default EmployeeDetails;
