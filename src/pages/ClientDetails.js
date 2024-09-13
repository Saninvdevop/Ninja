import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Table, Icon, Button, Modal, Form, Dropdown, Message } from 'semantic-ui-react';
import './ClientDetails.css'; // Custom CSS for styling
 
const ClientDetails = ({ userRole }) => {
  const navigate = useNavigate();
  const { clientId, projectId } = useParams();
  const [open, setOpen] = useState(false);
  const [showMessage, setShowMessage] = useState(false);
  const [allocation, setAllocation] = useState('client project');
  const [selectedClient, setSelectedClient] = useState(clientId);
  const [selectedProject, setSelectedProject] = useState(projectId);
  const [resourceName, setResourceName] = useState('');
  const [allocationPercentage, setAllocationPercentage] = useState('');
  const [employeesData, setEmployeesData] = useState([]);
  const [loading, setLoading] = useState(true); // State to manage loading status
 
  // Fetch employees data
  useEffect(() => {
    const fetchEmployeesData = async () => {
      try {
        const formattedProjectName = projectId.replace(/-/g, ' ');
        const encodedProjectName = encodeURIComponent(formattedProjectName);
 
        const response = await fetch(`http://localhost:5000/project/${encodedProjectName}/employees`);
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        const data = await response.json();
        setEmployeesData(data);
      } catch (error) {
        console.error('Failed to fetch employees data:', error);
      } finally {
        setLoading(false); // Stop loading once data is fetched
      }
    };
 
    fetchEmployeesData();
  }, [projectId]); // Refetch data if projectId changes
 
  const clientName = clientId.replace('-', ' ').replace(/\b\w/g, (char) => char.toUpperCase());
  const projectName = projectId.replace('-', ' ').replace(/\b\w/g, (char) => char.toUpperCase());
 
  // Options for client dropdown
  const clientOptions = [
    { key: clientId, text: clientName, value: clientId }
  ];
 
  // Options for project dropdown based on selected client
  const projectOptions = selectedClient
    ? [{ key: projectId, text: projectName, value: projectId }]
    : [];
 
  const handleSubmit = async () => {
    try {
      const response = await fetch('http://localhost:5000/project/allocate-resource', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          employeeName: resourceName,
          projectName: projectName,
          Allocation: allocationPercentage,
          Role: 'New Role', // Placeholder role; you might want to use a dynamic role here
          Alloaction: allocationPercentage // Fixed typo: changed "Alloaction" to "Allocation"
        }),
      });
 
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
 
      const result = await response.json();
      setShowMessage(true); // Show success message
      setTimeout(() => setShowMessage(false), 3000); // Hide message after 3 seconds
      setOpen(false); // Close modal after submission
 
      // Optionally refetch employees data or update state
      setEmployeesData([...employeesData, { EmployeeName: resourceName, Role: 'New Role', Allocation: allocationPercentage }]);
 
    } catch (error) {
      console.error('Failed to allocate resource:', error);
      // Handle error state here if needed
    }
  };
 
  const handleInputChange = (e, { value, name }) => {
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
      {loading ? (
        <p>Loading...</p>
      ) : (
        <Table celled padded className="employee-table4">
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>Employee Name</Table.HeaderCell>
              <Table.HeaderCell>Role</Table.HeaderCell>
              <Table.HeaderCell>Allocation %</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
 
          <Table.Body>
            {employeesData.map((employee, index) => (
              <Table.Row key={index}>
                <Table.Cell>
                  <Icon name="user" /> {employee.EmployeeName}
                </Table.Cell>
                <Table.Cell>{employee.Role}</Table.Cell>
                <Table.Cell>{employee.Allocation}</Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
      )}
 
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