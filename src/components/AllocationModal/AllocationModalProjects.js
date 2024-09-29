// src/components/AllocationModal/AllocationModalProjects.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Modal, 
  Button, 
  Form, 
  Dropdown, 
  Icon, 
  Loader, 
  Message, 
  Input, 
  Grid, 
  Segment, 
  Header 
} from 'semantic-ui-react';
import PropTypes from 'prop-types';
import axios from 'axios';
import { toast } from 'react-toastify';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import _ from 'lodash'; // Import lodash for debouncing

const AllocationModalProjects = ({
  open,
  onClose,
  onSave,
  employeeData,          
  clientProjectData,     
  allocationData,        
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
    allocationPercentDropdown: '',
    billingType: '',
    billedCheck: '',
    billingRate: '',
    timeSheetApprover: '',
    startDate: '',
    endDate: '',
  });

  const [employeeOptions, setEmployeeOptions] = useState([]);
  const [employeeNameLoading, setEmployeeNameLoading] = useState(false);
  const [employeeIdLoading, setEmployeeIdLoading] = useState(false);

  const [error, setError] = useState(null);
  const [clients, setClients] = useState([]);
  const [projects, setProjects] = useState([]);
  const [timeSheetApprovers, setTimeSheetApprovers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  const [fetchedRemainingAllocation, setFetchedRemainingAllocation] = useState(100);
  const [originalAllocationPercent, setOriginalAllocationPercent] = useState(0);
  const [billingEnabled, setBillingEnabled] = useState('no');
  const [allocation, setAllocation] = useState(0); // For circular progress

  // New States for Date Constraints
  const [isEndDateDisabled, setIsEndDateDisabled] = useState(true);
  const [minEndDate, setMinEndDate] = useState('');

  const [totalAllocation, setTotalAllocation] = useState(0);
  const [remainingAllocation, setRemainingAllocation] = useState(100);
  const [currentAllocation, setCurrentAllocation] = useState(0);

  useEffect(() => {
    const fetchEmployeesInitial = async () => {
      try {
        const response = await axios.get('http://localhost:8080/employees/search?query=');
        setEmployeeOptions(response.data.employees.map(emp => ({
          key: emp.EmployeeId,
          text: `${emp.EmployeeName} (${emp.EmployeeId})`,
          value: emp.EmployeeId,
          name: emp.EmployeeName,
        })));
      } catch (err) {
        console.error('Error fetching employees:', err);
      }
    };
    if (open) {
      fetchEmployeesInitial();
    }
  }, [open]);

  useEffect(() => {
    if (formData.clientId) {
      const associatedProjects = projects.filter(
        project => project.ClientID === formData.clientId
      );
  
      if (associatedProjects.length > 0) {
        const defaultApprover = associatedProjects[0].ProjectManager;
        setFormData(prev => ({
          ...prev,
          timeSheetApprover: defaultApprover || '', // Set to ProjectManager or empty string if undefined
        }));
      } else {
        // If no projects are associated, clear the Time Sheet Approver
        setFormData(prev => ({
          ...prev,
          timeSheetApprover: '',
        }));
      }
    } else {
      // If no client is selected, clear the Time Sheet Approver
      setFormData(prev => ({
        ...prev,
        timeSheetApprover: '',
      }));
    }
  }, [formData.clientId, projects]);
  

  useEffect(() => {
    const fetchTotalAllocation = async () => {
      if (!formData.employeeId || !formData.startDate || !formData.endDate) return;
      try {
        const response = await axios.get(`http://localhost:8080/employee-allocations/${formData.employeeId}`, {
          params: {
            startDate: formData.startDate,
            endDate: formData.endDate
          }
        });
        const newTotalAllocation = 100 - response.data.remainingAllocation;
        setTotalAllocation(newTotalAllocation);
        setRemainingAllocation(response.data.remainingAllocation);

        // If editing an existing allocation, set the current allocation
        if (allocationData) {
          const existingAllocation = allocationData.AllocationPercent || 0;
          setCurrentAllocation(existingAllocation);
          setFormData(prev => ({
            ...prev,
            allocationPercent: existingAllocation.toString(),
          }));
        }
      } catch (err) {
        console.error('Error fetching total allocation:', err);
        setError('Failed to compute total allocation.');
      }
    };
    if (open) {
      fetchTotalAllocation();
    }
  }, [open, formData.employeeId, formData.startDate, formData.endDate, allocationData]);

  // Fetch clients, projects, and timeSheetApprovers when the modal opens
  useEffect(() => {
    const fetchModalData = async () => {
      setLoading(true);
      setFetchError(null);
      try {
        const response = await axios.get('http://localhost:8080/modal/data');
        const { clients, projects, timeSheetApprovers } = response.data;
        setClients(clients);
        setProjects(projects);
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

  // Fetch remaining allocation when employeeData or allocationData changes
  useEffect(() => {
    const fetchRemainingAllocation = async () => {
      if (!formData.employeeId || !formData.startDate || !formData.endDate) return;

      try {
        const response = await axios.get(`http://localhost:8080/employee-allocations/${formData.employeeId}`, {
          params: {
            startDate: formData.startDate,
            endDate: formData.endDate
          }
        });
        setFetchedRemainingAllocation(response.data.remainingAllocation);
        setAllocation(100 - response.data.remainingAllocation); // Update allocation for the donut chart
      } catch (err) {
        console.error('Error fetching remaining allocation:', err);
        setError('Failed to compute remaining allocation.');
      }
    };

    if (open && formData.employeeId && formData.startDate && formData.endDate) {
      fetchRemainingAllocation();
    }
  }, [open, formData.employeeId, formData.startDate, formData.endDate]);

  // Update formData when allocationData, employeeData, or clientProjectData changes
  useEffect(() => {
    if (allocationData) {
      setFormData({
        // Use employeeData for Employee Name and ID
        employeeName: employeeData ? employeeData.EmployeeName : '',
        employeeId: employeeData ? employeeData.EmployeeId : '',
        clientId: allocationData.ClientID || '',
        projectId: allocationData.ProjectID || '',
        status: allocationData.AllocationStatus || '',
        allocationPercentDropdown: allocationData.allocationPercentDropdown ? allocationData.allocationPercentDropdown.toString() : '',
        allocationPercent: allocationData.AllocationPercent ? allocationData.AllocationPercent.toString() : '',
        billingType: allocationData.AllocationBillingType || '',
        billedCheck: allocationData.AllocationBilledCheck || '',
        billingRate: allocationData.AllocationBillingRate ? allocationData.AllocationBillingRate.toString() : '',
        timeSheetApprover: allocationData.AllocationTimeSheetApprover || '',
        startDate: allocationData.AllocationStartDate ? allocationData.AllocationStartDate.substring(0, 10) : '',
        endDate: allocationData.AllocationEndDate ? allocationData.AllocationEndDate.substring(0, 10) : '',
      });
      setOriginalAllocationPercent(allocationData.AllocationPercent || 0);
      setAllocation(allocationData.AllocationPercent || 0);

      // Enable End Date field if Start Date is present
      if (allocationData.AllocationStartDate) {
        setIsEndDateDisabled(false);
        setMinEndDate(allocationData.AllocationStartDate.substring(0, 10));
      }
    } else {
      // Reset form for adding new allocation
      setFormData({
        employeeName: employeeData ? employeeData.EmployeeName : '',
        employeeId: employeeData ? employeeData.EmployeeId : '',
        clientId: clientProjectData ? clientProjectData.clientId : '',
        projectId: clientProjectData ? clientProjectData.projectId : '',
        status: '',
        allocationPercentDropdown: '',
        allocationPercent: '',
        billingType: '',
        billedCheck: '',
        billingRate: '',
        timeSheetApprover: '',
        startDate: '',
        endDate: '',
      });
      setOriginalAllocationPercent(0);
      setAllocation(0);
      setIsEndDateDisabled(true);
      setMinEndDate('');
    }

    // Reset error when allocationData changes
    setError(null);
  }, [allocationData, employeeData, clientProjectData]);

  // Reset form when modal is closed
  useEffect(() => {
    if (!open) {
      // Reset form when modal is closed
      setFormData({
        employeeName: employeeData ? employeeData.EmployeeName : '',
        employeeId: employeeData ? employeeData.EmployeeId : '',
        clientId: clientProjectData ? clientProjectData.clientId : '',
        projectId: clientProjectData ? clientProjectData.projectId : '',
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
      setBillingEnabled('no');
      setAllocation(0);
      setIsEndDateDisabled(true);
      setMinEndDate('');
      setEmployeeOptions([]);
    }
  }, [open, employeeData, clientProjectData, allocationData]);

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



  // Auto-populate Employee Name when Employee ID is entered and vice versa
  useEffect(() => {
    const fetchEmployeeDetails = async () => {
      try {
        let response;
        if (formData.employeeId && !formData.employeeName) {
          response = await axios.get(`http://localhost:8080/employees/${formData.employeeId}`);
          setFormData(prev => ({
            ...prev,
            employeeName: response.data.employeeName || '',
          }));
        } else if (formData.employeeName && !formData.employeeId) {
          response = await axios.get(`http://localhost:8080/employees/search?query=${formData.employeeName}`);
          setFormData(prev => ({
            ...prev,
            employeeId: response.data.employeeId || '',
          }));
        }
      } catch (err) {
        console.error('Error fetching employee details:', err);
        setError('Invalid Employee ID or Name.');
      }
    };

    if (formData.employeeId || formData.employeeName) {
      fetchEmployeeDetails();
    }
  }, [formData.employeeId, formData.employeeName]);

  // Debounced function to fetch employees based on search query
  const fetchEmployees = useCallback(_.debounce(async (query, type) => {
    if (!query) {
      if (type === 'name') {
        setEmployeeOptions([]);
      }
      return;
    }

    try {
      const response = await axios.get('http://localhost:8080/employees/search', {
        params: { query }
      });
      const options = response.data.employees.map(emp => ({
        key: emp.EmployeeId,
        text: `${emp.EmployeeName} (${emp.EmployeeId})`,
        value: emp.EmployeeId,
        name: emp.EmployeeName,
      }));
      if (type === 'name') {
        setEmployeeOptions(options);
        setEmployeeNameLoading(false);
      } else if (type === 'id') {
        setEmployeeOptions(options);
        setEmployeeIdLoading(false);
      }
    } catch (err) {
      console.error('Error fetching employees:', err);
      if (type === 'name') {
        setEmployeeNameLoading(false);
      } else if (type === 'id') {
        setEmployeeIdLoading(false);
      }
    }
  }, 500), []); // 500ms debounce

  // Handle search change for Employee Name Dropdown
  const handleEmployeeNameSearchChange = (e, { searchQuery }) => {
    setEmployeeNameLoading(true);
    fetchEmployees(searchQuery, 'name');
  };

  // Handle search change for Employee ID Dropdown
  const handleEmployeeIdSearchChange = (e, { searchQuery }) => {
    setEmployeeIdLoading(true);
    fetchEmployees(searchQuery, 'id');
  };

  // Handle selection of Employee Name
  const handleEmployeeNameChange = (e, { value, options }) => {
    const selectedEmployee = options.find(option => option.value === value);
    if (selectedEmployee) {
      setFormData(prev => ({
        ...prev,
        employeeName: selectedEmployee.name,
        employeeId: selectedEmployee.value,
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        employeeName: '',
        employeeId: '',
      }));
    }
    setError(null);
  };

  // Handle selection of Employee ID
  const handleEmployeeIdChange = (e, { value, options }) => {
    const selectedEmployee = options.find(option => option.value === value);
    if (selectedEmployee) {
      setFormData(prev => ({
        ...prev,
        employeeId: selectedEmployee.value,
        employeeName: selectedEmployee.name,
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        employeeId: '',
        employeeName: '',
      }));
    }
    setError(null);
  };


  // Handle form field changes
  const handleChange = (e, { name, value }) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (name === 'allocationPercent') {
      const newAllocationPercent = parseInt(value, 10) || 0;
      setCurrentAllocation(newAllocationPercent);
    }

    // If allocationPercentDropdown changes, update allocationPercent as well
    if (name === 'allocationPercentDropdown') {
      setFormData((prev) => ({
        ...prev,
        allocationPercent: value,
      }));
      setAllocation(parseInt(value, 10) || 0);
    }

    if (name === 'billedCheck') {
      handleBillingChange(e, { value });
    }

    // If project is changed, update the Time Sheet Approver and Client ID
    if (name === 'projectId') {
      const selectedProject = projects.find(project => project.ProjectID === value);
      if (selectedProject) {
        // Set Time Sheet Approver based on Project Manager
        if (selectedProject.ProjectManager) {
          setFormData((prev) => ({
            ...prev,
            timeSheetApprover: selectedProject.ProjectManager,
          }));
        }

        // Set Client ID automatically based on selected Project
        setFormData((prev) => ({
          ...prev,
          clientId: selectedProject.ClientID,
        }));

        // Disable Client Name dropdown when Project is selected
        setIsEndDateDisabled(prev => prev);
      } else {
        // If no project is selected, allow manual selection of Client
        setIsEndDateDisabled(true);
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

    // Reset error when user modifies any field
    setError(null);
  };

  // Validate form fields
  const isFormValid = () => {
    const {
      clientId,
      projectId,
      status,
      allocationPercent,
      billingType,
      billedCheck, // Although we're removing billed check logic, keeping it for form validation if necessary
      billingRate,
      timeSheetApprover,
      startDate,
      endDate,
    } = formData;

    if (
      (!clientProjectData && (!clientId || !projectId)) || // If not prefilled, client and project are required
      !status ||
      allocationPercent === '' ||
      !billingType ||
      !billedCheck || // Keeping billedCheck as required since it's still part of the form
      !billingRate || // Billing Rate is always required now
      !timeSheetApprover ||
      !startDate ||
      !endDate // Ensure endDate is always required
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
    if (!formData.employeeId || !formData.employeeName) {
      setError('Employee Name and Employee ID are required.');
      return;
    }

    // Validate Billing Rate only if Billed? is Yes
    if (formData.billedCheck === 'Yes' && (!formData.billingRate || isNaN(formData.billingRate) || formData.billingRate <= 0)) {
      setError('Billing rate must be a positive number when billed.');
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
        const totalAllocationResponse = await axios.get(`http://localhost:8080/employee-allocations/${formData.employeeId}`, {
          params: {
            startDate: formData.startDate,
            endDate: formData.endDate
          }
        });
        const totalAllocation = 100 - totalAllocationResponse.data.remainingAllocation;
        const adjustedTotal = totalAllocation - originalAllocationPercent + parseInt(formData.allocationPercent, 10);

        if (adjustedTotal > 100) {
          setError('Total allocation percentage cannot exceed 100%.');
          return;
        }
      } else {
        // If adding new allocation
        const totalAllocationResponse = await axios.get(`http://localhost:8080/employee-allocations/${formData.employeeId}`, {
          params: {
            startDate: formData.startDate,
            endDate: formData.endDate
          }
        });
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
        AllocationPercentDropdown: parseInt(formData.allocationPercentDropdown, 10),
        AllocationPercent: parseInt(formData.allocationPercent, 10),
        AllocationStartDate: formData.startDate,
        AllocationEndDate: formData.endDate || null,
        AllocationTimeSheetApprover: formData.timeSheetApprover,
        AllocationBillingType: formData.billingType,
        AllocationBilledCheck: formData.billedCheck,
        AllocationBillingRate: formData.billedCheck === 'Yes' ? parseFloat(formData.billingRate) : 0.00, // Ensure it's 0.00 if No
        ModifiedBy: 'Admin',
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

  const AllocationPercentOptions = [
    { key: 0, text: '0%', value: '0' },
    { key: 25, text: '25%', value: '25' },
    { key: 50, text: '50%', value: '50' },
    { key: 75, text: '75%', value: '75' },
    { key: 100, text: '100%', value: '100' },
  ];
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

  // Handle Billing Radio Change
const handleBillingChange = (e, { value }) => {
  setFormData((prev) => ({
    ...prev,
    billedCheck: value,
    billingRate: value === 'Yes' ? prev.billingRate || '0.00' : '0.00', // Default to 0.00 if No is selected
  }));
};



  return (
    <Modal open={open} onClose={onClose} size="large" closeIcon>
      <Modal.Header>
        {allocationData ? 'Edit Allocation' : 'Add New Allocation'}
      </Modal.Header>
      <Modal.Content scrolling>
        {loading ? (
          <Loader active inline="centered" />
        ) : fetchError ? (
          <Message negative>
            <Message.Header>Error</Message.Header>
            <p>{fetchError}</p>
          </Message>
          
        ) : (
          <>
            <Grid stackable divided>
            <Grid.Row>
              <Grid.Column width={10}>
                <Form>
                  <Form.Group widths="equal">
                    <Form.Field required>
                      <label>Start Date</label>
                      <Input
                        type="date"
                        name="startDate"
                        value={formData.startDate}
                        onChange={(e, { name, value }) => {
                          handleChange(e, { name, value });
                          if (value) {
                            setIsEndDateDisabled(false);
                            setMinEndDate(value);
                            setFormData(prev => ({
                              ...prev,
                              endDate: '', // Reset End Date when Start Date changes
                            }));
                          } else {
                            setIsEndDateDisabled(true);
                            setMinEndDate('');
                          }
                        }}
                        min="2020-01-01"
                        max="2030-12-31"
                      />
                    </Form.Field>
                    <Form.Field required>
                      <label>End Date</label>
                      <Input
                        type="date"
                        name="endDate"
                        value={formData.endDate}
                        onChange={handleChange}
                        min={minEndDate}
                        disabled={isEndDateDisabled}
                        readOnly={false} // Users can select from calendar
                      />
                    </Form.Field>
                  </Form.Group>

                  <Form.Group widths="equal">
                    <Form.Field required>
                      <label>Project Name</label>
                      <Dropdown
                        placeholder="Select Project"
                        fluid
                        selection
                        options={projects.map(project => ({
                          key: project.ProjectID,
                          text: project.ProjectName,
                          value: project.ProjectID,
                        }))}
                        name="projectId"
                        value={formData.projectId}
                        onChange={handleChange}
                        clearable={!clientProjectData}
                        upward={true}
                      />
                    </Form.Field>
                    <Form.Field required>
                      <label>Client Name</label>
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
                        clearable={!clientProjectData && !formData.projectId} // Allow clearing only if projectId is not set
                        disabled={!!formData.projectId || !!clientProjectData} // Disable if projectId is set or clientProjectData is provided
                        upward={true}
                      />
                    </Form.Field>
                  </Form.Group>
                  <Form.Group widths="equal">
                                        {/* Employee Name Dropdown */}
                                        <Form.Field required>
                        <label>Employee Name</label>
                        <Dropdown
                          placeholder="Select Employee Name"
                          fluid
                          search
                          selection
                          options={employeeOptions}
                          onSearchChange={handleEmployeeNameSearchChange}
                          onChange={handleEmployeeNameChange}
                          loading={employeeNameLoading}
                          value={formData.employeeId}
                          selectOnBlur={false}
                          noResultsMessage="No employees found."
                          allowAdditions={false}
                        />
                      </Form.Field>

                      {/* Employee ID Dropdown */}
                      <Form.Field required>
                        <label>Employee ID</label>
                        <Dropdown
                          placeholder="Select Employee ID"
                          fluid
                          search
                          selection
                          options={employeeOptions.map(option => ({
                            key: option.value,
                            text: option.value,
                            value: option.value,
                            name: option.name,
                          }))}
                          onSearchChange={handleEmployeeIdSearchChange}
                          onChange={handleEmployeeIdChange}
                          loading={employeeIdLoading}
                          value={formData.employeeId}
                          selectOnBlur={false}
                          noResultsMessage="No employees found."
                          allowAdditions={false}
                        />
                      </Form.Field>
                  </Form.Group>
                </Form>
                {error && (
                  <Message negative>
                    <Message.Header>Error</Message.Header>
                    <p>{error}</p>
                  </Message>
                )}
              </Grid.Column>
              <Grid.Column width={6}>
                <Segment>
                  <Header as='h4' dividing>
                    Allocation %
                  </Header>
                  <div style={{ width: 150, height: 150, margin: '0 auto' }}>
                  <CircularProgressbar 
                    value={totalAllocation} 
                    text={`${totalAllocation}%`} 
                    styles={buildStyles({
                      textSize: '16px',
                      pathColor: '#3b82f6',
                      textColor: '#333',
                      trailColor: '#e2e8f0',
                    })}
                  />
                  </div>
                </Segment>
              </Grid.Column>
            </Grid.Row>
            <Grid.Row>
              <Grid.Column width={16}>
              <Form>
                <Form.Group widths="equal">
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
                      clearable
                      upward={true}
                    />
                  </Form.Field>
                  <Form.Field required>
                    <label>Allocation %</label>
                    <Dropdown
                      placeholder="Select Allocation %"
                      fluid
                      selection
                      options={AllocationPercentOptions.filter(option => 
                        parseInt(option.value, 10) <= (remainingAllocation + currentAllocation)
                      )}
                      name="allocationPercent"
                      value={formData.allocationPercent}
                      onChange={handleChange}
                      upward={true}
                      clearable
                    />
                    <div style={{ marginTop: '5px', color: 'gray', fontSize: '12px' }}>
                      Remaining Allocation: {remainingAllocation + currentAllocation}%
                    </div>
                  </Form.Field>
                  <Form.Field required>
                    <label>Status</label>
                    <Dropdown
                      placeholder="Set Status"
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
                      clearable
                      upward={true}
                    />
                  </Form.Field>
                  
                </Form.Group>
                <Form.Group widths="equal">
                  
                  <Form.Field required>
                      <label>Billing Type</label>
                      <Dropdown
                        placeholder="Select Billing Type"
                        fluid
                        selection
                        options={[
                          { key: 'tm', text: 'T&M', value: 'T&M' },
                          { key: 'fix', text: 'Fix Price', value: 'Fix Price' },
                        ]}
                        name="billingType"
                        value={formData.billingType}
                        onChange={handleChange}
                        upward={true}
                        clearable
                      />
                    </Form.Field>

                    <Form.Field required>
                      <label>Billed?</label>
                      <Dropdown
                        placeholder="Select Billed Check"
                        fluid
                        selection
                        options={[
                          { key: 'yes', text: 'Yes', value: 'Yes' },
                          { key: 'no', text: 'No', value: 'No' },
                        ]}
                        name="billedCheck"
                        value={formData.billedCheck}
                        onChange={handleChange}
                        clearable
                        upward={true}
                      />
                    </Form.Field>
                    {/* Always show Billing Rate field */}
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
                        max={999}
                        step="0.01"
                        iconPosition="left"
                        disabled={formData.billedCheck === 'No'} // Disable if Billed? is No
                        onKeyDown={(e) => {
                          const currentLength = e.target.value.length;
                          if (currentLength >= 10 && e.key !== 'Backspace' && e.key !== 'Delete') {
                            e.preventDefault();
                          }
                        }}
                      />
                    </Form.Field>
                </Form.Group>
              </Form>
              </Grid.Column>
            </Grid.Row>
          </Grid>
          </>
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
AllocationModalProjects.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  employeeData: PropTypes.shape({
    EmployeeName: PropTypes.string,
    EmployeeId: PropTypes.string,
  }), // Optional: Object containing EmployeeName and EmployeeID
  clientProjectData: PropTypes.shape({
    clientId: PropTypes.number,
    projectId: PropTypes.number,
  }), // Optional: Object containing ClientID and ProjectID
  allocationData: PropTypes.shape({
    AllocationID: PropTypes.number,
    ClientID: PropTypes.number,
    ProjectID: PropTypes.number,
    AllocationStatus: PropTypes.string,
    allocationPercentDropdown: PropTypes.number,
    AllocationPercent: PropTypes.number,
    AllocationStartDate: PropTypes.string,
    AllocationEndDate: PropTypes.string,
    AllocationBillingRate: PropTypes.number,
    AllocationTimeSheetApprover: PropTypes.string,
    AllocationBillingType: PropTypes.string,
    AllocationBilledCheck: PropTypes.string,
    ModifiedBy: PropTypes.string,
    ModifiedAt: PropTypes.string,
  }), // Allocation details or null
  userRole: PropTypes.string.isRequired,
};

export default AllocationModalProjects;