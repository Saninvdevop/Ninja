// src/pages/ClientDetails.js

import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom'; // Import useNavigate for navigation
import { Table, Icon, Button, Modal, Form, Dropdown, Message } from 'semantic-ui-react';
import './ClientDetails.css'; // Custom CSS for styling

const ClientDetails = ({ userRole }) => {  // Accept userRole as a prop
  const { clientId, projectId } = useParams(); // Get clientId and projectId from the URL
  const navigate = useNavigate(); // Initialize useNavigate for navigation

  // State to control modal visibility and messages
  const [open, setOpen] = useState(false);
  const [showMessage, setShowMessage] = useState(false); // State for toaster message
  const [allocation, setAllocation] = useState('client project'); // State for allocation dropdown
  const [selectedClient, setSelectedClient] = useState(clientId); // Auto-fill with current client
  const [selectedProject, setSelectedProject] = useState(projectId); // Auto-fill with current project
  const [resourceName, setResourceName] = useState(''); // State to manage resource name input
  const [allocationPercentage, setAllocationPercentage] = useState(''); // State to manage percentage input

  // Complete mock data for employees by client project with additional fields
  const initialEmployeesData = {
    'acme-corp': {
      'website-redesign': [
        { name: 'John Doe', role: 'Frontend Developer', status: 'Active', allocationPercentage: 50, allocationType: 'Client' },
        { name: 'Jane Smith', role: 'Backend Developer', status: 'Active', allocationPercentage: 70, allocationType: 'Client' },
      ],
      'mobile-app-development': [
        { name: 'Alice Johnson', role: 'Mobile Developer', status: 'On Leave', allocationPercentage: 30, allocationType: 'Benched' },
        { name: 'Bob Brown', role: 'QA Engineer', status: 'Active', allocationPercentage: 60, allocationType: 'Service' },
      ],
    },
    'global-tech': {
      'ai-research': [
        { name: 'Charlie Wilson', role: 'AI Scientist', status: 'Active', allocationPercentage: 80, allocationType: 'Client' },
        { name: 'Daisy Thomas', role: 'Data Analyst', status: 'Active', allocationPercentage: 60, allocationType: 'Client' },
      ],
      'data-migration': [
        { name: 'Evelyn White', role: 'Data Engineer', status: 'Active', allocationPercentage: 40, allocationType: 'Service' },
        { name: 'Frank Green', role: 'Database Admin', status: 'Active', allocationPercentage: 90, allocationType: 'Client' },
        { name: 'George Adams', role: 'Migration Specialist', status: 'Active', allocationPercentage: 100, allocationType: 'Benched' },
      ],
    },
    // ... Other clients remain unchanged
  };

  const [employeesData, setEmployeesData] = useState(initialEmployeesData); // State to manage employees data

  const clientName = clientId.replace('-', ' ').replace(/\b\w/g, (char) => char.toUpperCase());
  const projectName = projectId.replace('-', ' ').replace(/\b\w/g, (char) => char.toUpperCase());
  const employees = (employeesData[clientId] && employeesData[clientId][projectId]) || []; // Get employees for the current project under the current client

  // Options for client dropdown
  const clientOptions = Object.keys(employeesData).map((id) => ({
    key: id,
    text: id.replace('-', ' ').replace(/\b\w/g, (char) => char.toUpperCase()),
    value: id,
  }));

  // Options for project dropdown based on selected client
  const projectOptions = selectedClient
    ? Object.keys(employeesData[selectedClient]).map((projectId) => ({
        key: projectId,
        text: projectId.replace('-', ' ').replace(/\b\w/g, (char) => char.toUpperCase()),
        value: projectId,
      }))
    : [];

  const handleSubmit = () => {
    // Add new employee data to the existing list
    const newEmployee = {
      name: resourceName,
      role: 'New Role', // Placeholder role; this could be another input field in a real scenario
      status: 'Active', // Default status
      allocationPercentage: parseInt(allocationPercentage, 10),
      allocationType: 'Client', // Assuming fixed for this scenario
    };

    const updatedEmployees = {
      ...employeesData,
      [selectedClient]: {
        ...employeesData[selectedClient],
        [selectedProject]: [...employeesData[selectedClient][selectedProject], newEmployee], // Append new employee
      },
    };

    setEmployeesData(updatedEmployees); // Update state with new employee data
    setOpen(false); // Close modal after submission
    setShowMessage(true); // Show success message
    setTimeout(() => setShowMessage(false), 3000); // Hide message after 3 seconds
  };

  const handleInputChange = (e, { value, name }) => {
    // Update state and add 'filled' class if the input is filled
    if (name === 'selectedClient') setSelectedClient(value);
    if (name === 'selectedProject') setSelectedProject(value);
  };

  // Function to handle back navigation
  const handleBackClick = () => {
    navigate(-1); // Go back to the previous page
  };

  return (
    <div className="client-details-container">
      {/* Back Arrow Icon */}
      <Icon name="arrow left" size="large" style={{ cursor: 'pointer', marginBottom: '20px' }} onClick={handleBackClick} />

      <h2 className='emphead'>{`Employees for ${projectName}`}</h2>

      {/* Success Message */}
      {showMessage && <Message success header="Success" className="toaster-message" content="Resource successfully added!" />}

      {/* Allocate Resource Button - Only show if the user is not a leader */}
      {userRole !== 'leader' && (
        <Button className='add-icon1' icon color="green" onClick={() => setOpen(true)}>
          <Icon name="plus" />
        </Button>
      )}

      {/* Employees Table */}
      <Table celled padded className="employee-table4">
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell>Employee Name</Table.HeaderCell>
            <Table.HeaderCell>Role</Table.HeaderCell>
            <Table.HeaderCell>Status</Table.HeaderCell>
            <Table.HeaderCell>Allocation %</Table.HeaderCell> {/* New column */}
            <Table.HeaderCell>Allocation Type</Table.HeaderCell> {/* New column */}
          </Table.Row>
        </Table.Header>

        <Table.Body>
          {employees.map((employee, index) => (
            <Table.Row key={index}>
              <Table.Cell>
                <Icon name="user" /> {employee.name}
              </Table.Cell>
              <Table.Cell>{employee.role}</Table.Cell>
              <Table.Cell>{employee.status}</Table.Cell>
              <Table.Cell>{employee.allocationPercentage}</Table.Cell> {/* Allocation % data */}
              <Table.Cell>{employee.allocationType}</Table.Cell> {/* Allocation Type data */}
            </Table.Row>
          ))}
        </Table.Body>
      </Table>

      {/* Modal for Allocating Resource - Only accessible if not a leader */}
      {userRole !== 'leader' && (
        <Modal
          onClose={() => setOpen(false)}
          open={open}
          size="small"
        >
          <Modal.Header>Allocate Resource</Modal.Header>
          <Modal.Content>
            <Form>
              <Form.Input 
                label="Resource Name" 
                placeholder="Enter resource name" 
                required 
                className="resource-name-field"
                value={resourceName}
                onChange={(e) => {
                  setResourceName(e.target.value);
                  e.target.classList.toggle('filled', e.target.value !== '');
                }}
              />
              <Form.Field>
                <label>Allocation</label>
                <Dropdown
                  placeholder="Select Allocation"
                  fluid
                  selection
                  options={[{ key: 'client', text: 'Client Project', value: 'client project' }]}
                  value="client project"
                  disabled // Freeze allocation to 'Client Project'
                  className="allocation-field filled" // Add filled class initially as it's pre-filled
                />
              </Form.Field>
              <Form.Field>
                <label>Client Name</label>
                <Dropdown
                  placeholder="Select Client"
                  fluid
                  selection
                  options={clientOptions}
                  value={selectedClient}
                  required
                  disabled // Disable to prevent changing the auto-filled value
                  className={selectedClient ? 'filled' : ''} // Add filled class if value is present
                />
              </Form.Field>
              {selectedClient && (
                <Form.Field>
                  <label>Client Project</label>
                  <Dropdown
                    placeholder="Select Client Project"
                    fluid
                    selection
                    options={projectOptions}
                    value={selectedProject}
                    required
                    disabled // Disable to prevent changing the auto-filled value
                    className={selectedProject ? 'filled' : ''} // Add filled class if value is present
                  />
                </Form.Field>
              )}
              <Form.Input
                label="Percentage Allocation"
                placeholder="Enter percentage (e.g., 50%)"
                type="number"
                min="0"
                max="100"
                required
                className="percentage-allocation-field"
                value={allocationPercentage}
                onChange={(e) => {
                  setAllocationPercentage(e.target.value);
                  e.target.classList.toggle('filled', e.target.value !== '');
                }}
              />
            </Form>
          </Modal.Content>
          <Modal.Actions>
            <Button color="black" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              content="Submit"
              labelPosition="right"
              icon="checkmark"
              onClick={handleSubmit}
              primary
            />
          </Modal.Actions>
        </Modal>
      )}
    </div>
  );
};

export default ClientDetails;
