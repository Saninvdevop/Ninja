import React, { useState, useEffect } from 'react';
import { useLocation, useParams, useNavigate } from 'react-router-dom';
import { Card, Icon, Table, Button, Modal, Form, Dropdown } from 'semantic-ui-react';
import { Doughnut } from 'react-chartjs-2';
import 'chart.js/auto';
import './EmployeeDetails.css';

const EmployeeDetails = ({ userRole }) => {  // Accept userRole as a prop
  const { id } = useParams(); 
  const [error, setError] = useState(null);
  const location = useLocation();
  const navigate = useNavigate(); // Initialize useNavigate for navigation
  const { employee, allocationPercentage: initialAllocation } = location.state; // Get the employee and initial allocation percentage from state
  
  // Client data and project data from Projects.js
  const [clientData, setClientData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [allocations, setAllocations] = useState([]);
  const [projectOptions, setProjectOptions] = useState([]);
  const [open, setOpen] = useState(false);
  const [newAllocation, setNewAllocation] = useState({
    employeeName: employee.EmployeeName,
    employeeId: employee.EmployeeID,
    clientName: '',
    projectName: '',
    status: '',
    allocation: '',
    startDate: '',
    endDate: '',
    billingRate: '',
    timeSheetApprover: '',
  });

  // Fetch client data from API
  useEffect(() => {
    const fetchClientData = async () => {
      try {
        setLoading(true);
        const Response = await fetch('http://localhost:5000/clients');
        
        if (!Response.ok) {
          throw new Error('Network response was not ok');
        }

        const Data = await Response.json();
        setClientData(Data);
        
      } catch (error) {
        console.error('Fetch error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchClientData();
  }, []);

  // Options for client dropdown
  const clientOptions = clientData.map((client) => ({
    key: client.ClientID,
    text: client.ClientName,
    value: client.ClientName, // Using company name as value to match table entries
  }));

  // State to manage selected client and project
  const [selectedClient, setSelectedClient] = useState('');
  // State to manage the currently edited allocation
  const [editIndex, setEditIndex] = useState(null);

  // Function to fetch employee allocation data
  const fetchEmployeeData = async () => {
    try {
      const response = await fetch(`http://localhost:5000/detailed-view/${id}`);
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const data = await response.json();
      setAllocations(data);
    } catch (error) {
      console.error('Fetch error:', error);
      setError('Failed to load employee data');
    }
  };

  // Fetch employee data on component mount
  useEffect(() => {
    fetchEmployeeData();
  }, [id]);

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
      employeeName: employee.EmployeeName,
      employeeId: employee.EmployeeID,
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
    setSelectedClient(allocationToEdit.ClientID); // Set selected client to populate project dropdown
    setEditIndex(index);

    // Populate project options based on the selected client
    const selectedClientData = clientData.find((client) => client.company === allocationToEdit.clientName);
    const projects = selectedClientData?.projects.map((project) => ({
      key: project,
      text: project,
      value: project,
    })) || [];
    setProjectOptions(projects);

    setOpen(true); // Open the modal
  };

  // Calculate total allocation percentage based on allocations data
  const calculateTotalAllocationPercentage = () => {
    return allocations.reduce((total, alloc) => total + parseFloat(alloc.Allocation || 0), 0);
  };

  const totalAllocationPercentage = calculateTotalAllocationPercentage();

  // Calculate the remaining percentage to show in the doughnut chart
  const remainingPercentage = 100 - totalAllocationPercentage;

  // Data for Doughnut Chart
  const doughnutData = {
    labels: ['Remaining', 'Allocated'],
    datasets: [
      {
        data: [remainingPercentage, totalAllocationPercentage],
        backgroundColor:
          remainingPercentage === 100
            ? ['#FF0000', '#e0e0e0'] // 100% red if 0% is allocated
            : remainingPercentage <= 35
            ? ['#77dd77', '#e0e0e0'] // Green if 35% or less remaining
            : remainingPercentage <= 70
            ? ['#FFA500', '#e0e0e0'] // Orange if 70% or less remaining
            : ['#FF0000', '#e0e0e0'], // Red if more than 70% remaining
        hoverBackgroundColor: ['#66cc66', '#c0c0c0'],
        borderWidth: 2,
        borderColor: remainingPercentage === 100
          ? ['#FF0000', '#e0e0e0']
          : remainingPercentage <= 35
          ? ['#77dd77', '#e0e0e0']
          : remainingPercentage <= 70
          ? ['#FFA500', '#e0e0e0']
          : ['#FF0000', '#e0e0e0'],
        borderRadius: 10,
        cutout: '80%',
      },
    ],
  };

  // Function to handle submission when doughnut chart turns into a button
  const handleSubmit = () => {
    alert('All allocations submitted successfully!');
  };

  // Function to open the modal and set the pre-filled values
  const handleOpenModal = () => {
    setNewAllocation({
      employeeName: employee.EmployeeName,
      employeeId: employee.EmployeeID,
      clientName: '',
      projectName: '',
      status: '',
      allocation: '',
      startDate: '',
      endDate: '',
      billingRate: '', // New field for Billing Rate
      timeSheetApprover: '', // New field for Time Sheet Approver
    });
    setEditIndex(null); // Reset edit index
    setOpen(true); // Open the modal
  };

  // Function to handle back navigation
  const handleBackClick = () => {
    navigate(-1); // Navigate back to the previous page
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

  return (
    <div className="employee-details-container">
      {/* Back Arrow Icon */}
      <Icon
        name="arrow left"
        size="large"
        style={{ cursor: 'pointer', marginBottom: '20px' }}
        onClick={handleBackClick}
      />

      <div className="details-chart-container">
        {/* Employee Details Card */}
        <Card className="employee-card" centered>
          <Card.Content>
            <Card.Header className="card-header">
              {employee.EmployeeName} {/* Dynamic Employee Name */}
            </Card.Header>
            <Card.Meta className="card-meta">
              <span>
                <Icon name="briefcase" /> {employee.role} {/* Dynamic Role */}
              </span>
              <span>
                <Icon name="mail" /> {employee.Email} {/* Dynamic Email */}
              </span>
            </Card.Meta>
            <Card.Description className="card-description">
              {/* Grid Items for Business Unit, Cost Center, Department, etc. */}
              <div className="grid-item">
                <span className="heading">Business Unit</span>
                <span className="content">Innover</span> {/* Hardcoded Business Unit */}
              </div>
              <div className="grid-item">
                <span className="heading">Cost Center</span>
                <span className="content">INV - KOL</span> {/* Hardcoded Cost Center */}
              </div>
              <div className="grid-item">
                <span className="heading">Department</span>
                <span className="content">INV</span> {/* Hardcoded Department */}
              </div>
              <div className="grid-item1">
                <span className="content">
                  <Icon name="phone" /> {employee.phone || '9902432463'} {/* Dynamic or fallback Phone Number */}
                </span>
              </div>
              <div className="grid-item">
                <span className="content">
                  <Icon name="map marker alternate" /> {employee.location || 'BLR'} {/* Dynamic or fallback Location */}
                </span>
              </div>
              <div className="grid-item">
                <span className="content">
                  <Icon name="hashtag" /> {employee.EmployeeID} {/* Dynamic Employee ID */}
                </span>
              </div>
            </Card.Description>
          </Card.Content>
        </Card>

        {/* Conditional Rendering for Doughnut Chart or Submit Button */}
        <div className="doughnut-chart-container">
          {/* Legend for Doughnut Chart */}
          <div className="doughnut-chart-legend">
            <span style={{ display: 'flex', alignItems: 'center' }}>
              <div
                style={{
                  width: '10px',
                  height: '10px',
                  backgroundColor: '#FF0000',
                  borderRadius: '50%',
                  marginRight: '8px',
                }}
              ></div>
              <span style={{ fontSize: '0.9rem', color: '#666' }}>Red means 100% unallocated</span>
            </span>
          </div>

          {/* Doughnut Chart */}
          <Doughnut
            data={doughnutData}
            options={{
              plugins: {
                legend: {
                  display: false,
                },
              },
              maintainAspectRatio: false,
            }}
          />
          <div className="doughnut-chart-label">
            {remainingPercentage > 0 ? (
              <div className="number">{remainingPercentage}%</div>
            ) : (
              <Button
                className="submit-button"
                onClick={handleSubmit}
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  backgroundColor: '#66cc66',
                  color: '#fff',
                }}
              >
                Submit
              </Button>
            )}
          </div>
        </div>

      </div>

      {/* Allocations Table */}
      <h3>Allocations</h3>
      <Table celled striped className="allocations-table">
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell>Employee Name</Table.HeaderCell>
            <Table.HeaderCell>Employee ID</Table.HeaderCell>
            <Table.HeaderCell>Client Name</Table.HeaderCell>
            <Table.HeaderCell>Project Name</Table.HeaderCell>
            <Table.HeaderCell>Allocation %</Table.HeaderCell>
            <Table.HeaderCell>Status</Table.HeaderCell>
            <Table.HeaderCell>Start Date</Table.HeaderCell>
            <Table.HeaderCell>End Date</Table.HeaderCell>
            <Table.HeaderCell>Actions</Table.HeaderCell> {/* New column for actions */}
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {allocations.map((alloc, index) => (
            <Table.Row key={index}>
              <Table.Cell>{alloc.EmployeeName}</Table.Cell>
              <Table.Cell>{alloc.EmployeeID}</Table.Cell>
              <Table.Cell>{alloc.ClientName}</Table.Cell>
              <Table.Cell>{alloc.ProjectName}</Table.Cell>
              <Table.Cell>{alloc.Allocation}</Table.Cell>
              <Table.Cell>{alloc.ProjectStatus}</Table.Cell>
              <Table.Cell>{alloc.AllocationStartDate}</Table.Cell>
              <Table.Cell>{alloc.AllocationEndDate}</Table.Cell>
              <Table.Cell>
                <Button icon="edit" onClick={() => handleEditAllocation(index)} />
                <Button icon="trash" color="red" onClick={() => handleDeleteAllocation(index)} />
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table>

      {/* Add Allocation Button */}
      {/* Conditionally Render Add Allocation Button for bizops role only */}
      {userRole === 'bizops' && (
        <Button icon onClick={handleOpenModal} className="add-icon">
          <Icon name="plus" />
        </Button>
      )}

      {/* Modal for Adding or Editing Allocation */}
      <Modal
  open={open}
  onClose={() => setOpen(false)}
  size="tiny"
  dimmer="blurring"
>
  <Modal.Header>{editIndex !== null ? 'Edit Allocation' : 'Add New Allocation'}</Modal.Header>
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
                placeholder='Select Client'
                fluid
                selection
                options={clientData.map(client => ({
                  key: client.ClientName,
                  text: client.ClientName,
                  value: client.ClientName,
                }))}
                value={newAllocation.clientName}
                onChange={handleClientChange}
              />
            </Form.Field>
            <Form.Field>
              <label>Project</label>
              <Dropdown
                placeholder='Select Project'
                fluid
                selection
                options={projectOptions}
                value={newAllocation.projectName}
                onChange={handleProjectChange}
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
                const allocationValue = e.target.value;
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
              required
            />
            <Form.Input
              label="Billing Rate"
              placeholder="Enter billing rate"
              type="number"
              value={newAllocation.billingRate}
              onChange={(e) =>
                setNewAllocation({ ...newAllocation, billingRate: e.target.value })
              }
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
