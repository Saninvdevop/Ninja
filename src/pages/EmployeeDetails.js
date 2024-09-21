import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Icon, Table, Button, Modal, Form, Dropdown, Popup } from 'semantic-ui-react';
import 'chart.js/auto';
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
  
  const [employeeData, setEmployeeData] = useState(null); // New state for employee details
  const [allocations, setAllocations] = useState([]); // Assuming allocations are separate
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

  // Add the handleDownloadExcel function
  const handleDownloadExcel = () => {
    if (!employeeData) return; // Ensure employee data is available

    // Create a new workbook and a worksheet
    const workbook = XLSX.utils.book_new();
    
    // Convert allocations data to worksheet
    const worksheetData = allocations.map(alloc => ({
      'Employee Name': alloc.EmployeeName,
      'Employee ID': alloc.EmployeeID,
      'Client Name': alloc.ClientName,
      'Project Name': alloc.ProjectName,
      'Allocation %': alloc.Allocation,
      'Status': alloc.ProjectStatus,
      'Start Date': alloc.AllocationStartDate,
      'End Date': alloc.AllocationEndDate,
    }));
    
    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    
    // Append worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Allocations');
    
    // Generate buffer
    const workbookOut = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    
    // Create a Blob from the buffer
    const blob = new Blob([workbookOut], { type: 'application/octet-stream' });
    
    // Trigger the download using FileSaver
    saveAs(blob, `${employeeData.EmployeeName}_Allocations.xlsx`);
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
      // If allocations are part of employee data, set them here
      // setAllocations(data.allocations || []);
    } catch (error) {
      console.error('Fetch error:', error);
      setError('Failed to load employee data');
    } finally {
      setLoading(false);
    }
  };

  // Fetch employee data on component mount
  useEffect(() => {
    fetchEmployeeData();
  }, [id]);

  // Options for client dropdown
  const clientOptions = clientData.map((client) => ({
    key: client.ClientID,
    text: client.ClientName,
    value: client.ClientName, // Using company name as value to match table entries
  }));

  // Sorting function
  const handleSort = (column) => {
    let direction = 'ascending';
    if (sortColumn === column && sortDirection === 'ascending') {
      direction = 'descending';
    }
    const sortedData = [...allocations].sort((a, b) => {
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
          Allocation: newAllocation.allocation,
          Role: newAllocation.status,
          AllocationStartDate: newAllocation.startDate,
          AllocationEndDate: newAllocation.endDate,
          TimesheetApproval: newAllocation.timeSheetApprover,
          BillingRate: newAllocation.billingRate,
        }),
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const data = await response.json();
      console.log('Allocation saved successfully:', data);
    } catch (error) {
      console.error('Error saving allocation:', error);
    }
  };

  const handleSaveAllocation = async () => {
    if (editIndex !== null) {
      // Edit existing allocation
      const updatedAllocations = [...allocations];
      updatedAllocations[editIndex] = { ...newAllocation, allocation: parseInt(newAllocation.allocation) };
      setAllocations(updatedAllocations);
    } else {
      // Add new allocation
      setAllocations([
        ...allocations,
        {
          ...newAllocation,
          allocation: parseInt(newAllocation.allocation),
        },
      ]);
    }

    // Send data to backend
    await submitAllocation();

    // Fetch updated data to refresh UI
    fetchEmployeeData();

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
  const handleDeleteAllocation = (index) => {
    const updatedAllocations = allocations.filter((_, i) => i !== index);
    setAllocations(updatedAllocations);
  };

  // Function to handle edit button click
  const handleEditAllocation = (index) => {
    const allocationToEdit = allocations[index];
    setNewAllocation(allocationToEdit); // Set the state with values from the selected allocation
    setSelectedClient(allocationToEdit.ClientName); // Set selected client to populate project dropdown
    setEditIndex(index);

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
    return allocations.reduce((total, alloc) => total + parseFloat(alloc.Allocation || 0), 0);
  };

  const totalAllocationPercentage = calculateTotalAllocationPercentage();
  // Calculate the remaining percentage to show in the doughnut chart
  const remainingPercentage = 100 - totalAllocationPercentage;
  // Data for the donut chart
  const dataValues = [totalAllocationPercentage, remainingPercentage];
  const colors =
    totalAllocationPercentage === 100
      ? ['#77dd77', '#e0e0e0'] // Green if 100% allocated
      : remainingPercentage === 100
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
    if (totalAllocationPercentage === 100) {
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
    // You can replace this URL with your logic to generate images based on the first character
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
                total={totalAllocationPercentage} 
                dataValues={dataValues} 
                labels={labels} 
                colors={colors}
              />
            </div>
          </div>
        )}
        
        {!loading && employeeData && (
          <div className="bottom-content">
            <div className='table'>
              <Table celled sortable>
                <Table.Header>
                  <Table.Row>
                    <Table.HeaderCell onClick={() => handleSort('EmployeeName')}>
                      Employee Name {renderSortIcon('EmployeeName')}
                    </Table.HeaderCell>
                    <Table.HeaderCell onClick={() => handleSort('EmployeeId')}>
                      Employee ID {renderSortIcon('EmployeeId')}
                    </Table.HeaderCell>
                    <Table.HeaderCell onClick={() => handleSort('ClientName')}>
                      Client Name {renderSortIcon('ClientName')}
                    </Table.HeaderCell>
                    <Table.HeaderCell onClick={() => handleSort('ProjectName')}>
                      Project Name {renderSortIcon('ProjectName')}
                    </Table.HeaderCell>
                    <Table.HeaderCell onClick={() => handleSort('Allocation')}>
                      Allocation % {renderSortIcon('Allocation')}
                    </Table.HeaderCell>
                    <Table.HeaderCell onClick={() => handleSort('ProjectStatus')}>
                      Status {renderSortIcon('ProjectStatus')}
                    </Table.HeaderCell>
                    <Table.HeaderCell onClick={() => handleSort('AllocationStartDate')}>
                      Start Date {renderSortIcon('AllocationStartDate')}
                    </Table.HeaderCell>
                    <Table.HeaderCell onClick={() => handleSort('AllocationEndDate')}>
                      End Date {renderSortIcon('AllocationEndDate')}
                    </Table.HeaderCell>
                    <Table.HeaderCell>Actions</Table.HeaderCell>
                  </Table.Row>
                </Table.Header>

                <Table.Body>
                  {allocations.length > 0 ? (
                    allocations.map((alloc, index) => (
                      <Table.Row key={index}>
                        <Table.Cell>{alloc.EmployeeName}</Table.Cell>
                        <Table.Cell>{alloc.EmployeeID}</Table.Cell>
                        <Table.Cell>{alloc.ClientName}</Table.Cell>
                        <Table.Cell>{alloc.ProjectName}</Table.Cell>
                        <Table.Cell>{alloc.Allocation}%</Table.Cell>
                        <Table.Cell>{alloc.ProjectStatus}</Table.Cell>
                        <Table.Cell>{alloc.AllocationStartDate}</Table.Cell>
                        <Table.Cell>{alloc.AllocationEndDate}</Table.Cell>
                        <Table.Cell>
                          <Button icon="edit" onClick={() => handleEditAllocation(index)} />
                          <Button icon="trash" color="red" onClick={() => handleDeleteAllocation(index)} />
                        </Table.Cell>
                      </Table.Row>
                    ))
                  ) : (
                    <Table.Row>
                      <Table.Cell colSpan="9" textAlign="center">
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
                let allocationValue = Math.max(0, Math.min(e.target.value, 100 - totalAllocationPercentage)); 

                // Update the newAllocation state with the valid allocation value
                setNewAllocation((prev) => ({ ...prev, allocation: allocationValue }));

                // Update status based on conditions dynamically
                if (newAllocation.clientName && newAllocation.projectName && (!allocationValue || allocationValue === '0')) {
                  setNewAllocation((prev) => ({ ...prev, status: 'Project Unallocated' }));
                } else if (newAllocation.clientName && newAllocation.projectName && allocationValue && allocationValue !== '0') {
                  setNewAllocation((prev) => ({ ...prev, status: 'Allocated' }));
                } else if (newAllocation.clientName && !newAllocation.projectName) {
                  setNewAllocation((prev) => ({ ...prev, status: 'Client Unallocated' }));
                }
              }}
              min={0} // Prevent negative values
              max={100 - totalAllocationPercentage} // Set the maximum to the remaining allocation
              required
            />

            {/* Display remaining allocation */}
            {newAllocation.allocation && (
              <p style={{ color: 'gray', fontSize: '12px', marginTop: '5px' }}>
                {100 - totalAllocationPercentage - newAllocation.allocation}% allocation remaining.
              </p>
            )}

            <Form.Input
              label="Billing Rate (USD)"
              placeholder="Enter billing rate"
              type="number"
              value={newAllocation.billingRate}
              onChange={(e) => {
                // Ensure the billing rate is always non-negative
                const billingRate = Math.max(0, e.target.value);
                setNewAllocation((prev) => ({ ...prev, billingRate }));
              }}
              min={0} // Prevent negative values
              required
            />

            <Form.Input
              label="Time Sheet Approver"
              placeholder="Enter Time Sheet Approver"
              value={newAllocation.timeSheetApprover}
              onChange={(e) =>
                setNewAllocation({ ...newAllocation, timeSheetApprover: e.target.value })
              }
              required
            />
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
