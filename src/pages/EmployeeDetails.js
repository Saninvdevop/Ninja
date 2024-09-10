import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom'; // Import useNavigate for navigation
import { Card, Icon, Table, Button, Modal, Form, Dropdown } from 'semantic-ui-react';
import { Doughnut } from 'react-chartjs-2';
import 'chart.js/auto';
import './EmployeeDetails.css';

const EmployeeDetails = ({ userRole }) => {  // Accept userRole as a prop
  const location = useLocation();
  const navigate = useNavigate(); // Initialize useNavigate for navigation
  const { employee, allocationPercentage: initialAllocation } = location.state; // Get the employee and initial allocation percentage from state

  // Client data and project data from Projects.js
  const clientData = [
    {
      company: 'Acme Corp',
      projects: ['Website Redesign', 'Mobile App Development'],
      id: 'acme-corp',
    },
    {
      company: 'Global Tech',
      projects: ['AI Research', 'Data Migration'],
      id: 'global-tech',
    },
    {
      company: 'Healthify Inc.',
      projects: ['Health Tracking App', 'Wellness Portal'],
      id: 'healthify-inc',
    },
    {
      company: 'EduPro',
      projects: ['E-learning Platform', 'Course Management System'],
      id: 'edupro',
    },
    {
      company: 'Innover',
      projects: ['Benched'],
      id: 'innover',
    },
  ];

  // Options for client dropdown
  const clientOptions = clientData.map((client) => ({
    key: client.id,
    text: client.company,
    value: client.company, // Using company name as value to match table entries
  }));

  // State to manage the allocation data
  const [allocations, setAllocations] = useState([
    {
      employeeName: employee.employee_name,
      employeeId: employee.employee_id,
      clientName: 'Acme Corp',
      projectName: 'Website Redesign',
      allocation: initialAllocation, // Initialize with passed allocation percentage
      status: 'Active',
      startDate: '2020-05-02',
      endDate: '2024-05-02',
      billingRate: 100, // Example billing rate
      timeSheetApprover: 'John Doe', // Example timesheet approver
    },
  ]);

  // State to manage modal visibility
  const [open, setOpen] = useState(false);

  // State to manage new allocation input
  const [newAllocation, setNewAllocation] = useState({
    employeeName: employee.employee_name, // Pre-fill with current employee name
    employeeId: employee.employee_id, // Pre-fill with current employee ID
    clientName: '',
    projectName: '',
    status: '',
    allocation: '',
    startDate: '',
    endDate: '',
    billingRate: '', // New field for Billing Rate
    timeSheetApprover: '', // New field for Time Sheet Approver
  });

  // State to manage selected client and project
  const [selectedClient, setSelectedClient] = useState('');
  const [projectOptions, setProjectOptions] = useState([]);

  // State to manage the currently edited allocation
  const [editIndex, setEditIndex] = useState(null);

  // Options for status dropdown
  const statusOptions = [
    { key: 'allocated', text: 'Project Allocated', value: 'Project Allocated' },
    { key: 'unallocated', text: 'Project Unallocated', value: 'Project Unallocated' },
    { key: 'x', text: 'X', value: 'X' },
  ];

  // Function to handle client change and update project options
  const handleClientChange = (e, { value }) => {
    setSelectedClient(value);
    setNewAllocation({ ...newAllocation, clientName: value, projectName: '' });

    // Get project options for the selected client
    const selectedClientData = clientData.find((client) => client.company === value);
    const projects = selectedClientData?.projects.map((project) => ({
      key: project,
      text: project,
      value: project,
    })) || [];
    setProjectOptions(projects); // Update project options based on selected client
  };

  // Function to handle adding or editing an allocation
  const handleSaveAllocation = () => {
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

    // Clear form fields after saving
    setNewAllocation({
      employeeName: employee.employee_name,
      employeeId: employee.employee_id,
      clientName: '',
      projectName: '',
      status: '',
      allocation: '',
      startDate: '',
      endDate: '',
      billingRate: '', // Clear new field
      timeSheetApprover: '', // Clear new field
    });

    setSelectedClient('');
    setProjectOptions([]);
    setOpen(false); // Close the modal
    setEditIndex(null); // Reset edit index
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
    setSelectedClient(allocationToEdit.clientName); // Set selected client to populate project dropdown
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

  // Calculate total allocation percentage
  const totalAllocationPercentage = allocations.reduce(
    (total, alloc) => total + alloc.allocation,
    0
  );

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
      employeeName: employee.employee_name,
      employeeId: employee.employee_id,
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
              {employee.employee_name} {/* Dynamic Employee Name */}
            </Card.Header>
            <Card.Meta className="card-meta">
              <span>
                <Icon name="briefcase" /> {employee.role} {/* Dynamic Role */}
              </span>
              <span>
                <Icon name="mail" /> {employee.email} {/* Dynamic Email */}
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
                  <Icon name="hashtag" /> {employee.employee_id} {/* Dynamic Employee ID */}
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
    <Table.HeaderCell>Billing Rate</Table.HeaderCell> {/* New column */}
    <Table.HeaderCell>Time Sheet Approver</Table.HeaderCell> {/* New column */}
    <Table.HeaderCell>Modified By</Table.HeaderCell> {/* New column */}
    <Table.HeaderCell>Actions</Table.HeaderCell> {/* New column for actions */}
  </Table.Row>
</Table.Header>

<Table.Body>
  {allocations.map((alloc, index) => (
    <Table.Row key={index}>
      <Table.Cell>{alloc.employeeName}</Table.Cell>
      <Table.Cell>{alloc.employeeId}</Table.Cell>
      <Table.Cell>{alloc.clientName}</Table.Cell>
      <Table.Cell>{alloc.projectName}</Table.Cell>
      <Table.Cell>{alloc.allocation}</Table.Cell>
      <Table.Cell>{alloc.status}</Table.Cell>
      <Table.Cell>{alloc.startDate}</Table.Cell>
      <Table.Cell>{alloc.endDate}</Table.Cell>
      <Table.Cell>{alloc.billingRate} USD</Table.Cell> {/* Billing Rate data */}
      <Table.Cell>{alloc.timeSheetApprover}</Table.Cell> {/* Time Sheet Approver data */}
      <Table.Cell>Modified by Kiran on 24th January 2024</Table.Cell> {/* New column */}
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
              <label>Client Name</label>
              <Dropdown
                placeholder="Select Client"
                fluid
                selection
                options={[
                  { key: 'none', text: 'None', value: '' }, // Add "None" option
                  ...clientOptions,
                ]}
                value={newAllocation.clientName}
                onChange={(e, { value }) => {
                  setSelectedClient(value);
                  setNewAllocation({ ...newAllocation, clientName: value, projectName: '' }); // Reset project when client changes

                  // Update project options based on selected client
                  if (value) {
                    const selectedClientData = clientData.find((client) => client.company === value);
                    const projects = selectedClientData?.projects.map((project) => ({
                      key: project,
                      text: project,
                      value: project,
                    })) || [];

                    setProjectOptions([
                      { key: 'none', text: 'None', value: '' },  // Include "None" option
                      ...projects,
                    ]);

                    // Automatically set status if client is selected but no project
                    setNewAllocation((prev) => ({
                      ...prev,
                      status: !prev.projectName ? 'Client Unallocated' : prev.status,
                    }));
                  } else {
                    setProjectOptions([]); // Clear project options if no client selected
                    setNewAllocation((prev) => ({ ...prev, status: '' })); // Reset status if no client
                  }
                }}
                required
              />
            </Form.Field>
            {selectedClient && (
              <Form.Field>
                <label>Project Name</label>
                <Dropdown
                  placeholder="Select Project"
                  fluid
                  selection
                  options={projectOptions}
                  value={newAllocation.projectName}
                  onChange={(e, { value }) => {
                    setNewAllocation((prev) => ({ ...prev, projectName: value }));

                    // Automatically set status if both client and project are selected but allocation is 0 or empty
                    if (newAllocation.clientName && value && (!newAllocation.allocation || newAllocation.allocation === '0')) {
                      setNewAllocation((prev) => ({ ...prev, status: 'Project Unallocated' }));
                    } else if (newAllocation.clientName && value && newAllocation.allocation && newAllocation.allocation !== '0') {
                      // Automatically set status to Allocated if both client, project are filled, and allocation is greater than 0
                      setNewAllocation((prev) => ({ ...prev, status: 'Allocated' }));
                    }
                  }}
                  required
                />
              </Form.Field>
            )}
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
