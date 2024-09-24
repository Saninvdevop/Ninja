// src/components/AllocationModal/AllocationModal.jsx

import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Dropdown, Icon, Loader, Message, Input } from 'semantic-ui-react';
import PropTypes from 'prop-types';
import axios from 'axios';

const AllocationModal = ({
  open,
  onClose,
  onSave,
  employeeData,
  allocationData,
  userRole,
  currentAllocation,
  stagedChangesPercent
}) => {
  // Initialize state with either existing allocation data or default values
  const [formData, setFormData] = useState({
    employeeName: '',
    employeeId: '',
    clientId: '',
    projectId: '',
    status: '',
    allocationPercent: '',
    billingType: '',
    billedCheck: '',
    billingRate: '',
    timeSheetApprover: '',
    startDate: '',
    endDate: '',
  });

  const [error, setError] = useState(null);
  const [clients, setClients] = useState([]);
  const [projects, setProjects] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [timeSheetApprovers, setTimeSheetApprovers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  const [remainingAllocation, setRemainingAllocation] = useState(100);
  const [existingAllocations, setExistingAllocations] = useState([]);

  // Allocation Percent Options
  const allocationOptions = [
    { key: 0, text: '0%', value: 0 },
    { key: 25, text: '25%', value: 25 },
    { key: 50, text: '50%', value: 50 },
    { key: 75, text: '75%', value: 75 },
    { key: 100, text: '100%', value: 100 },
  ];

  // Billing Type Options
  const billingTypeOptions = [
    { key: 'tm', text: 'T&M', value: 'T&M' },
    { key: 'fix', text: 'Fix Price', value: 'Fix Price' },
  ];

  // Billed Check Options
  const billedCheckOptions = [
    { key: 'yes', text: 'Yes', value: 'Yes' },
    { key: 'no', text: 'No', value: 'No' },
  ];

  // Fetch clients, projects, employees, and timeSheetApprovers when the modal opens
  useEffect(() => {
    const fetchModalData = async () => {
      setLoading(true);
      setFetchError(null);
      try {
        const response = await axios.get('http://localhost:8080/modal/data');
        const { clients, projects, employees, timeSheetApprovers } = response.data;
        setClients(clients);
        setProjects(projects);
        setEmployees(employees);
        setTimeSheetApprovers(timeSheetApprovers);
      } catch (err) {
        console.error('Error fetching modal data:', err);
        setFetchError('Failed to load form data.');
      } finally {
        setLoading(false);
      }
    };

    if (open) {
      fetchModalData();
    }
  }, [open]);

  // Fetch existing allocations for overlap validation
  useEffect(() => {
    const fetchExistingAllocations = async () => {
      try {
        const response = await axios.get(`http://localhost:8080/employee-details/${employeeData.EmployeeId}/allocations`);
        setExistingAllocations(response.data.allocations);
      } catch (err) {
        console.error('Error fetching existing allocations:', err);
        setError('Failed to load existing allocations for validation.');
      }
    };

    if (open && employeeData && employeeData.EmployeeId) {
      fetchExistingAllocations();
    }
  }, [open, employeeData]);

  // Fetch remaining allocation when employeeData changes
  useEffect(() => {
    const fetchRemainingAllocation = async () => {
      if (!employeeData || !employeeData.EmployeeId) return;

      try {
        const response = await axios.get(`http://localhost:8080/employee-allocations/${employeeData.EmployeeId}`);
        setRemainingAllocation(response.data.remainingAllocation);
      } catch (err) {
        console.error('Error fetching remaining allocation:', err);
        setError('Failed to compute remaining allocation.');
      }
    };

    if (open) {
      fetchRemainingAllocation();
    }
  }, [open, employeeData]);

  // Update formData when allocationData or employeeData changes
  useEffect(() => {
    if (allocationData) {
      setFormData({
        employeeName: employeeData ? employeeData.EmployeeName : '',
        employeeId: employeeData ? employeeData.EmployeeId : '',
        clientId: allocationData.ClientID || '',
        projectId: allocationData.ProjectID || '',
        status: allocationData.AllocationStatus || '',
        allocationPercent: allocationData.AllocationPercent
          ? allocationData.AllocationPercent
          : '',
        billingType: allocationData.AllocationBillingType || '',
        billedCheck: allocationData.AllocationBilledCheck || '',
        billingRate: allocationData.AllocationBillingRate
          ? allocationData.AllocationBillingRate
          : '',
        timeSheetApprover: allocationData.AllocationTimeSheetApprover || '',
        startDate: allocationData.AllocationStartDate
          ? allocationData.AllocationStartDate.substring(0, 10)
          : '',
        endDate: allocationData.AllocationEndDate
          ? allocationData.AllocationEndDate.substring(0, 10)
          : '',
      });
    } else {
      // Reset form for adding new allocation
      setFormData({
        employeeName: employeeData ? employeeData.EmployeeName : '',
        employeeId: employeeData ? employeeData.EmployeeId : '',
        clientId: '',
        projectId: '',
        status: '',
        allocationPercent: '',
        billingType: '',
        billedCheck: '',
        billingRate: '',
        timeSheetApprover: '',
        startDate: '',
        endDate: '',
      });
    }

    // Reset error when allocationData changes
    setError(null);
  }, [allocationData, employeeData]);

  // Reset form when modal is closed
  useEffect(() => {
    if (!open) {
      setFormData({
        employeeName: employeeData ? employeeData.EmployeeName : '',
        employeeId: employeeData ? employeeData.EmployeeId : '',
        clientId: '',
        projectId: '',
        status: '',
        allocationPercent: '',
        billingType: '',
        billedCheck: '',
        billingRate: '',
        timeSheetApprover: '',
        startDate: '',
        endDate: '',
      });
      setError(null);
      setFetchError(null);
    }
  }, [open, employeeData, allocationData]);

  // Helper function to check date overlap
  const isOverlapping = (newStart, newEnd, existingStart, existingEnd) => {
    const startA = new Date(newStart);
    const endA = newEnd ? new Date(newEnd) : new Date('9999-12-31');
    const startB = new Date(existingStart);
    const endB = existingEnd ? new Date(existingEnd) : new Date('9999-12-31');

    return startA <= endB && startB <= endA;
  };

  // Handle form field changes
  const handleChange = (e, { name, value }) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // If billedCheck is changed to 'No', clear billingRate
    if (name === 'billedCheck' && value !== 'Yes') {
      setFormData((prev) => ({
        ...prev,
        billingRate: '',
      }));
    }

    // If project is changed, update the Time Sheet Approver options
    if (name === 'projectId') {
      const selectedProject = projects.find(project => project.ProjectID === value);
      if (selectedProject && selectedProject.ProjectManager) {
        setFormData((prev) => ({
          ...prev,
          timeSheetApprover: selectedProject.ProjectManager,
        }));
      }
    }

    // Dynamically update status based on allocation percentage and selected fields
    if (name === 'allocationPercent') {
      const allocationValue = parseInt(value, 10);
      if (
        formData.clientId &&
        formData.projectId &&
        (allocationValue === 0)
      ) {
        setFormData((prev) => ({ ...prev, status: 'Project Unallocated' }));
      } else if (
        formData.clientId &&
        formData.projectId &&
        allocationValue > 0
      ) {
        setFormData((prev) => ({ ...prev, status: 'Allocated' }));
      } else if (formData.clientId && !formData.projectId) {
        setFormData((prev) => ({ ...prev, status: 'Client Unallocated' }));
      } else {
        setFormData((prev) => ({ ...prev, status: '' }));
      }
    }

    // Update remaining allocation if allocationPercent changes
    if (name === 'allocationPercent') {
      const selectedValue = parseInt(value, 10);
      const newRemaining = 100 - currentAllocation - stagedChangesPercent - selectedValue;
      setRemainingAllocation(newRemaining >= 0 ? newRemaining : 0);
    }
  };

  // Validate form fields
  const isFormValid = () => {
    const {
      clientId,
      projectId,
      status,
      allocationPercent,
      billingType,
      billedCheck,
      billingRate,
      timeSheetApprover,
      startDate,
      endDate,
    } = formData;

    if (
      !clientId ||
      !projectId ||
      !status ||
      allocationPercent === '' ||
      !billingType ||
      !billedCheck ||
      (billedCheck === 'Yes' && !billingRate) ||
      !timeSheetApprover ||
      !startDate
    ) {
      return false;
    }

    // Check if start date is before 2020
    const start = new Date(startDate);
    const minStartDate = new Date('2020-01-01');
    if (start < minStartDate) {
      setError('Start Date cannot be before January 1, 2020.');
      return false;
    }

    if (status === 'Allocated' && !endDate) {
      return false;
    }

    // Additional validation for AllocationEndDate
    if (endDate && startDate && new Date(endDate) < new Date(startDate)) {
      return false;
    }

    return true;
  };

  // Handle form submission
  const handleSubmit = () => {
    // Basic validation
    if (!isFormValid()) {
      if (!error) {
        setError('Please fill in all required fields correctly.');
      }
      return;
    }

    // Check for overlapping allocations
    const overlapping = existingAllocations.some(alloc => {
      // If editing, exclude the current allocation
      if (allocationData && alloc.AllocationID === allocationData.AllocationID) {
        return false;
      }

      // Check if the project is the same
      if (alloc.ProjectID !== formData.projectId) {
        return false;
      }

      // Check for date overlap
      return isOverlapping(
        formData.startDate,
        formData.endDate,
        alloc.AllocationStartDate,
        alloc.AllocationEndDate
      );
    });

    if (overlapping) {
      setError('Allocation overlaps with an existing allocation for the same project.');
      return;
    }

    // Check total allocation does not exceed 100%
    if (currentAllocation + stagedChangesPercent + parseInt(formData.allocationPercent, 10) > 100) {
      setError('Total allocation percentage cannot exceed 100%.');
      return;
    }

    // Prepare the payload
    const payload = {
      EmployeeID: formData.employeeId,
      ClientID: formData.clientId,
      ProjectID: formData.projectId,
      AllocationStatus: formData.status,
      AllocationPercent: parseInt(formData.allocationPercent, 10),
      AllocationStartDate: formData.startDate,
      AllocationEndDate: formData.endDate || null,
      AllocationTimeSheetApprover: formData.timeSheetApprover,
      AllocationBillingType: formData.billingType,
      AllocationBilledCheck: formData.billedCheck,
      ModifiedBy: 'Admin', // Adjust as needed or pass as a prop
    };

    if (formData.billedCheck === 'Yes') {
      payload.AllocationBillingRate = parseFloat(formData.billingRate);
    } else {
      payload.AllocationBillingRate = null;
    }

    // If editing, include AllocationID
    if (allocationData && allocationData.AllocationID) {
      payload.AllocationID = allocationData.AllocationID;
    }

    // Call the onSave prop with the payload
    onSave(payload);

    // Reset the form (handled by useEffect on modal close)
  };

  // Helper function to generate project options based on selected client
  const getFilteredProjectOptions = () => {
    if (formData.clientId === '') {
      return [];
    }

    return projects
      .filter(project => project.ClientID === formData.clientId)
      .map(project => ({
        key: project.ProjectID,
        text: project.ProjectName,
        value: project.ProjectID,
      }));
  };

  // Helper function to get Time Sheet Approver options
  const getTimeSheetApproverOptions = () => {
    const staticOptions = [
      { key: 'shishir', text: 'Shishir', value: 'Shishir' },
      { key: 'rajendra', text: 'Rajendra', value: 'Rajendra' },
      { key: 'kiran', text: 'Kiran', value: 'Kiran' },
    ];

    // Include Project Manager as an option
    const projectManager = projects.find(project => project.ProjectID === formData.projectId)?.ProjectManager;
    const dynamicOptions = projectManager
      ? [{ key: `pm-${projectManager}`, text: projectManager, value: projectManager }]
      : [];

    // Combine static and dynamic options, ensuring uniqueness
    const combinedOptions = [
      ...staticOptions,
      ...timeSheetApprovers.map(approver => ({
        key: approver,
        text: approver,
        value: approver,
      })),
      ...dynamicOptions,
    ];

    // Remove duplicates
    const uniqueOptions = Array.from(new Map(combinedOptions.map(item => [item.key, item])).values());

    return uniqueOptions;
  };

  return (
    <Modal open={open} onClose={onClose} size="large" dimmer="blurring">
      <Modal.Header>
        {allocationData ? 'Edit Allocation' : 'Add New Allocation'}
        <Icon
          name="close"
          size="large"
          style={{ float: 'right', cursor: 'pointer' }}
          onClick={onClose}
        />
      </Modal.Header>
      <Modal.Content>
        {loading ? (
          <Loader active inline="centered" />
        ) : fetchError ? (
          <Message negative>
            <Message.Header>Error</Message.Header>
            <p>{fetchError}</p>
          </Message>
        ) : (
          <Form>
            <Form.Group widths="equal">
              <Form.Input
                label="Employee Name"
                placeholder="Employee Name"
                name="employeeName"
                value={formData.employeeName}
                readOnly
              />
              <Form.Input
                label="Employee ID"
                placeholder="Employee ID"
                name="employeeId"
                value={formData.employeeId}
                readOnly
              />
            </Form.Group>

            <Form.Field required>
              <label>Client</label>
              <Dropdown
                placeholder="Select Client"
                fluid
                selection
                options={clients.map(client => ({
                  key: client.ClientID,
                  text: client.ClientName,
                  value: client.ClientID,
                }))}
                name="clientId"
                value={formData.clientId}
                onChange={handleChange}
                selection
                clearable
              />
            </Form.Field>

            <Form.Field required>
              <label>Project</label>
              <Dropdown
                placeholder="Select Project"
                fluid
                selection
                options={getFilteredProjectOptions()}
                name="projectId"
                value={formData.projectId}
                onChange={handleChange}
                disabled={!formData.clientId}
                selection
                clearable
              />
            </Form.Field>

            <Form.Field required>
              <label>Status</label>
              <Dropdown
                placeholder="Select Status"
                fluid
                selection
                options={[
                  { key: 'client-unallocated', text: 'Client Unallocated', value: 'Client Unallocated' },
                  { key: 'project-unallocated', text: 'Project Unallocated', value: 'Project Unallocated' },
                  { key: 'allocated', text: 'Allocated', value: 'Allocated' },
                  { key: 'closed', text: 'Closed', value: 'Closed' },
                ]}
                name="status"
                value={formData.status}
                onChange={handleChange}
                selection
                clearable
              />
            </Form.Field>

            <Form.Field required>
              <label>Allocation %</label>
              <Dropdown
                placeholder="Select Allocation Percentage"
                fluid
                selection
                options={allocationOptions.filter(option => option.value <= (100 - currentAllocation - stagedChangesPercent))}
                name="allocationPercent"
                value={formData.allocationPercent}
                onChange={handleChange}
                selection
                clearable
              />
              <p style={{ color: 'gray', fontSize: '12px', marginTop: '5px' }}>
                Remaining Allocation: {remainingAllocation}%
              </p>
            </Form.Field>

            <Form.Field required>
              <label>Billing Type</label>
              <Dropdown
                placeholder="Select Billing Type"
                fluid
                selection
                options={billingTypeOptions}
                name="billingType"
                value={formData.billingType}
                onChange={handleChange}
                selection
                clearable
              />
            </Form.Field>

            <Form.Field required>
                <label>Billed Check</label>
                <Dropdown
                    placeholder="Select Billed Check"
                    fluid
                    selection
                    options={billedCheckOptions}
                    name="billedCheck"
                    value={formData.billedCheck}
                    onChange={(e, { name, value }) => {
                    setFormData(prev => ({
                        ...prev,
                        [name]: value,
                        billingRate: value === 'No' ? 0 : prev.billingRate,  // Automatically set billingRate to 0 when "No"
                    }));
                    }}
                    selection
                    clearable
                />
            </Form.Field>

            <Form.Field required={formData.billedCheck === 'Yes'}>
                <label>Billing Rate (USD)</label>
                <Input
                    label={{ basic: true, content: '$' }}
                    labelPosition="left"
                    placeholder="Enter billing rate"
                    name="billingRate"
                    value={formData.billedCheck === 'Yes' ? formData.billingRate : 0} // Set value to 0 when billedCheck is 'No'
                    onChange={handleChange}
                    type="number"
                    min={0}
                    max={9999}
                    step="0.01"
                    maxLength={5} // Allows up to 4 digits plus decimal
                    icon={{ name: 'dollar', color: 'grey' }}
                    iconPosition="left"
                    disabled={formData.billedCheck !== 'Yes'}  // Disable when billedCheck is 'No'
                    // Prevent entering more than 4 digits
                    onKeyDown={(e) => {
                    const currentLength = e.target.value.length;
                    if (currentLength >= 5 && e.key !== 'Backspace' && e.key !== 'Delete') {
                        e.preventDefault();
                    }
                    }}
                />
            </Form.Field>


            <Form.Field required>
              <label>Time Sheet Approver</label>
              <Dropdown
                placeholder="Select Approver"
                fluid
                selection
                options={getTimeSheetApproverOptions()}
                name="timeSheetApprover"
                value={formData.timeSheetApprover}
                onChange={handleChange}
                selection
                clearable
              />
            </Form.Field>

            <Form.Group widths="equal">
              <Form.Field required>
                <label>Start Date</label>
                <Input
                  type="date"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleChange}
                  required
                  min="2020-01-01" // Restrict start dates to 2020 and beyond
                />
              </Form.Field>

              <Form.Field required={formData.status === 'Allocated'}>
                <label>End Date</label>
                <Input
                  type="date"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleChange}
                  required={formData.startDate}
                  disabled={formData.startDate === ''}
                  min={formData.startDate || '2020-01-01'} // Ensure end date is not before start date
                />
              </Form.Field>
            </Form.Group>
          </Form>
        )}
        {error && (
          <Message negative>
            <Message.Header>Error</Message.Header>
            <p>{error}</p>
          </Message>
        )}
      </Modal.Content>
      <Modal.Actions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          color="blue"
          onClick={handleSubmit}
          disabled={!isFormValid() || loading}
        >
          {allocationData ? 'Update' : 'Save'}
        </Button>
      </Modal.Actions>
    </Modal>
  );
};

// Define PropTypes for better type checking
AllocationModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  employeeData: PropTypes.shape({
    EmployeeName: PropTypes.string,
    EmployeeId: PropTypes.string,
  }),       // Object containing EmployeeName and EmployeeID
  allocationData: PropTypes.shape({
    AllocationID: PropTypes.number,
    ClientID: PropTypes.number,
    ProjectID: PropTypes.number,
    AllocationStatus: PropTypes.string,
    AllocationPercent: PropTypes.number,
    AllocationStartDate: PropTypes.string,
    AllocationEndDate: PropTypes.string,
    AllocationBillingRate: PropTypes.number,
    AllocationTimeSheetApprover: PropTypes.string,
    AllocationBillingType: PropTypes.string,
    AllocationBilledCheck: PropTypes.string,
  }),     // Allocation details or null
  userRole: PropTypes.string.isRequired,
  currentAllocation: PropTypes.number.isRequired, // Passed from parent
  stagedChangesPercent: PropTypes.number.isRequired, // Passed from parent
};

export default AllocationModal;
