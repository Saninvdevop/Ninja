// src/components/AllocationModal/AllocationModal.jsx

import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Dropdown, Icon, Loader, Message, Input } from 'semantic-ui-react';
import PropTypes from 'prop-types';
import axios from 'axios';
import { toast } from 'react-toastify';

const AllocationModal = ({
  open,
  onClose,
  onSave,
  employeeData,
  allocationData, // Renamed to camelCase
  userRole,
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

  // New State Variables for Dynamic Remaining Allocation
  const [fetchedRemainingAllocation, setFetchedRemainingAllocation] = useState(100);
  const [originalAllocationPercent, setOriginalAllocationPercent] = useState(0);

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
        setFetchedRemainingAllocation(response.data.remainingAllocation);
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
        allocationPercent: allocationData.AllocationPercent ? allocationData.AllocationPercent : '',
        billingType: allocationData.AllocationBillingType || '',
        billedCheck: allocationData.AllocationBilledCheck || '',
        billingRate: allocationData.AllocationBillingRate ? allocationData.AllocationBillingRate : '',
        timeSheetApprover: allocationData.AllocationTimeSheetApprover || '',
        startDate: allocationData.AllocationStartDate ? allocationData.AllocationStartDate.substring(0, 10) : '',
        endDate: allocationData.AllocationEndDate ? allocationData.AllocationEndDate.substring(0, 10) : '',
      });
      setOriginalAllocationPercent(allocationData.AllocationPercent || 0);
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
      setOriginalAllocationPercent(0);
    }

    // Reset error when allocationData changes
    setError(null);
  }, [allocationData, employeeData]);

  // Reset form when modal is closed
  useEffect(() => {
    if (!open) {
      // Reset form when modal is closed
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
      setFetchedRemainingAllocation(100);
      setOriginalAllocationPercent(0);
      setRemainingAllocation(100);
    }
  }, [open, employeeData, allocationData]);

  // Compute Remaining Allocation Dynamically
  useEffect(() => {
    let newRemaining = 0;
    const currentAllocationPercent = parseInt(formData.allocationPercent, 10) || 0;

    if (allocationData) {
      // Editing existing allocation
      newRemaining = fetchedRemainingAllocation + (originalAllocationPercent || 0) - currentAllocationPercent;
    } else {
      // Adding new allocation
      newRemaining = fetchedRemainingAllocation - currentAllocationPercent;
    }

    setRemainingAllocation(newRemaining >= 0 ? newRemaining : 0);
  }, [fetchedRemainingAllocation, originalAllocationPercent, formData.allocationPercent, allocationData]);

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
      setError('End Date cannot be before Start Date.');
      return false;
    }

    return true;
  };

  // Handle form submission
  const handleSubmit = async () => {
    // Basic validation
    if (!isFormValid()) {
      if (!error) {
        setError('Please fill in all required fields correctly.');
      }
      return;
    }

    try {
      // Check for overlapping allocations
      const overlapResponse = await axios.get(`http://localhost:8080/employee-details/${formData.employeeId}/allocations`);
      const allocationsList = overlapResponse.data.allocations;

      const hasOverlap = allocationsList.some(alloc => {
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

      if (hasOverlap) {
        setError('Allocation overlaps with an existing allocation for the same project.');
        return;
      }

      // Check total allocation does not exceed 100%
      if (allocationData) {
        // If editing, subtract the current allocation percent from total allocation
        const totalAllocationResponse = await axios.get(`http://localhost:8080/employee-allocations/${formData.employeeId}`);
        const totalAllocation = 100 - totalAllocationResponse.data.remainingAllocation;
        const adjustedTotal = totalAllocation - originalAllocationPercent + parseInt(formData.allocationPercent, 10);

        if (adjustedTotal > 100) {
          setError('Total allocation percentage cannot exceed 100%.');
          return;
        }
      } else {
        // If adding new allocation
        const totalAllocationResponse = await axios.get(`http://localhost:8080/employee-allocations/${formData.employeeId}`);
        const totalAllocation = 100 - totalAllocationResponse.data.remainingAllocation;

        if (totalAllocation + parseInt(formData.allocationPercent, 10) > 100) {
          setError('Total allocation percentage cannot exceed 100%.');
          return;
        }
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
        AllocationBillingRate: formData.billedCheck === 'Yes' ? parseFloat(formData.billingRate) : null,
        ModifiedBy: 'Admin', // Adjust as needed or pass as a prop
      };

      if (allocationData && allocationData.AllocationID) {
        // Editing existing allocation
        await axios.put(`http://localhost:8080/allocations/${allocationData.AllocationID}`, payload);
        toast.success('Allocation updated successfully!');
      } else {
        // Adding new allocation
        await axios.post('http://localhost:8080/api/allocate', payload);
        toast.success('Allocation added successfully!');
      }

      onSave(); // Refresh allocations in parent component
      onClose(); // Close the modal
    } catch (err) {
      console.error('Error adding/updating allocation:', err);
      setError(err.response?.data?.message || 'Failed to add/update allocation.');
    }
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
                options={allocationOptions.filter(option => option.value <= remainingAllocation)}
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
                    billingRate: value === 'No' ? '' : prev.billingRate,  // Clear billingRate if 'No'
                  }));
                }}
                selection
                clearable
              />
            </Form.Field>

            {formData.billedCheck === 'Yes' && (
              <Form.Field required>
                <label>Billing Rate (USD)</label>
                <Input
                  label={{ basic: true, content: '$' }}
                  labelPosition="left"
                  placeholder="Enter billing rate"
                  name="billingRate"
                  value={formData.billingRate}
                  onChange={handleChange}
                  type="number"
                  min={0}
                  max={9999}
                  step="0.01"
                  maxLength={5} // Allows up to 4 digits plus decimal
                  icon={{ name: 'dollar', color: 'grey' }}
                  iconPosition="left"
                  // Prevent entering more than 4 digits
                  onKeyDown={(e) => {
                    const currentLength = e.target.value.length;
                    if (currentLength >= 5 && e.key !== 'Backspace' && e.key !== 'Delete') {
                      e.preventDefault();
                    }
                  }}
                />
              </Form.Field>
            )}

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

              {formData.status === 'Allocated' && (
                <Form.Field required>
                  <label>End Date</label>
                  <Input
                    type="date"
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleChange}
                    required={formData.status === 'Allocated'}
                    min={formData.startDate || '2020-01-01'} // Ensure end date is not before start date
                  />
                </Form.Field>
              )}
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
  }), // Object containing EmployeeName and EmployeeID
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
  }), // Allocation details or null
  userRole: PropTypes.string.isRequired,
};

export default AllocationModal;
