// src/components/AllocationModal/AllocationModal.jsx

import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Dropdown, Icon } from 'semantic-ui-react';
import PropTypes from 'prop-types';

const AllocationModal = ({
  open,
  onClose,
  onSave,
  employeeData,       // Object containing EmployeeName and EmployeeID
  allocationData,     // Object containing allocation details or null
  clientOptions,      // Array of client options for Dropdown
  projectOptions,     // Array of project options for Dropdown
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
    startDate: '',
    endDate: '',
    billingRate: '',
    timeSheetApprover: '',
  });

  const [error, setError] = useState(null);

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
          ? allocationData.AllocationPercent.toString()
          : '',
        startDate: allocationData.AllocationStartDate
          ? allocationData.AllocationStartDate.substring(0, 10)
          : '',
        endDate: allocationData.AllocationEndDate
          ? allocationData.AllocationEndDate.substring(0, 10)
          : '',
        billingRate: allocationData.AllocationBillingRate
          ? allocationData.AllocationBillingRate.toString()
          : '',
        timeSheetApprover: allocationData.AllocationTimeSheetApprover || '',
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
        startDate: '',
        endDate: '',
        billingRate: '',
        timeSheetApprover: '',
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
        startDate: '',
        endDate: '',
        billingRate: '',
        timeSheetApprover: '',
      });
      setError(null);
    }
  }, [open, employeeData, allocationData]);

  // Handle form field changes
  const handleChange = (e, { name, value }) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Dynamically update status based on allocation percentage and selected fields
    if (name === 'allocationPercent') {
      const allocationValue = parseInt(value, 10);
      if (
        formData.clientId &&
        formData.projectId &&
        (!allocationValue || allocationValue === 0)
      ) {
        setFormData((prev) => ({ ...prev, status: 'Project Unallocated' }));
      } else if (
        formData.clientId &&
        formData.projectId &&
        allocationValue &&
        allocationValue !== 0
      ) {
        setFormData((prev) => ({ ...prev, status: 'Allocated' }));
      } else if (formData.clientId && !formData.projectId) {
        setFormData((prev) => ({ ...prev, status: 'Client Unallocated' }));
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
      startDate,
      billingRate,
      timeSheetApprover,
    } = formData;
    return (
      clientId &&
      projectId &&
      status &&
      allocationPercent &&
      startDate &&
      billingRate &&
      timeSheetApprover &&
      (status !== 'Allocated' || formData.endDate) // If allocated, endDate is required
    );
  };

  // Handle form submission
  const handleSubmit = () => {
    // Basic validation
    if (!isFormValid()) {
      setError('Please fill in all required fields.');
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
      AllocationBillingRate: parseFloat(formData.billingRate),
      ModifiedBy: 'Admin', // Adjust as needed or pass as a prop
    };

    // If editing, include AllocationID
    if (allocationData && allocationData.AllocationID) {
      payload.AllocationID = allocationData.AllocationID;
    }

    // Call the onSave prop with the payload
    onSave(payload);

    // Reset the form (handled by useEffect on modal close)
  };

  return (
    <Modal open={open} onClose={onClose} size="small" dimmer="blurring">
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
        <Form>
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
          <Form.Field>
            <label>Client</label>
            <Dropdown
              placeholder="Select Client"
              fluid
              selection
              options={clientOptions}
              name="clientId"
              value={formData.clientId}
              onChange={handleChange}
              required
            />
          </Form.Field>
          <Form.Field>
            <label>Project</label>
            <Dropdown
              placeholder="Select Project"
              fluid
              selection
              options={
                formData.clientId === 'Innover' // Adjust if 'Innover' is a ClientID or ClientName
                  ? [
                      { key: 'Benched', text: 'Benched', value: 'Benched' },
                    ]
                  : projectOptions.filter(
                      (project) => project.ClientID === formData.clientId
                    )
              }
              name="projectId"
              value={formData.projectId}
              onChange={handleChange}
              disabled={formData.clientId === 'Innover'}
              required
            />
          </Form.Field>
          <Form.Field>
            <label>Status</label>
            <Dropdown
              placeholder="Select Status"
              fluid
              selection
              options={[
                {
                  key: 'client-unallocated',
                  text: 'Client Unallocated',
                  value: 'Client Unallocated',
                },
                {
                  key: 'project-unallocated',
                  text: 'Project Unallocated',
                  value: 'Project Unallocated',
                },
                {
                  key: 'allocated',
                  text: 'Allocated',
                  value: 'Allocated',
                },
                {
                  key: 'closed',
                  text: 'Closed',
                  value: 'Closed',
                },
              ]}
              name="status"
              value={formData.status}
              onChange={handleChange}
              required
            />
          </Form.Field>
          <Form.Input
            label="Allocation %"
            type="number"
            placeholder="Enter allocation percentage"
            name="allocationPercent"
            value={formData.allocationPercent}
            onChange={handleChange}
            min={0}
            max={100}
            required
          />
          {/* Display remaining allocation if needed */}
          {formData.allocationPercent && (
            <p
              style={{
                color: 'gray',
                fontSize: '12px',
                marginTop: '5px',
              }}
            >
              {100 - parseInt(formData.allocationPercent, 10)}% allocation
              remaining.
            </p>
          )}
          <Form.Input
            label="Billing Rate (USD)"
            placeholder="Enter billing rate"
            type="number"
            name="billingRate"
            value={formData.billingRate}
            onChange={handleChange}
            min={0}
            step="0.01"
            required
          />
          <Form.Field>
            <label>Time Sheet Approver</label>
            <Dropdown
              placeholder="Select Approver"
              fluid
              selection
              options={[
                {
                  key: 'rajendra',
                  text: 'Rajendra',
                  value: 'Rajendra',
                },
                {
                  key: 'kiran',
                  text: 'Kiran',
                  value: 'Kiran',
                },
                {
                  key: 'shishir',
                  text: 'Shishir',
                  value: 'Shishir',
                },
              ]}
              name="timeSheetApprover"
              value={formData.timeSheetApprover}
              onChange={handleChange}
              required
            />
          </Form.Field>
          <Form.Input
            label="Start Date"
            type="date"
            placeholder="Enter start date"
            name="startDate"
            value={formData.startDate}
            onChange={handleChange}
            required
          />
          <Form.Input
            label="End Date"
            type="date"
            placeholder="Enter end date"
            name="endDate"
            value={formData.endDate}
            onChange={handleChange}
            required={formData.status === 'Allocated'}
            disabled={!formData.status || formData.status !== 'Allocated'}
          />
        </Form>
        {error && <p style={{ color: 'red' }}>{error}</p>}
      </Modal.Content>
      <Modal.Actions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          color="blue"
          onClick={handleSubmit}
          disabled={!isFormValid()}
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
  employeeData: PropTypes.object,       // Object containing EmployeeName and EmployeeID
  allocationData: PropTypes.object,     // Allocation details or null
  clientOptions: PropTypes.array.isRequired,  // For Client Dropdown
  projectOptions: PropTypes.array.isRequired, // For Project Dropdown
  userRole: PropTypes.string.isRequired,
};

export default AllocationModal;
