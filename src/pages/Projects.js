import React, { useState, useEffect } from 'react';
import { Table, Icon, Button, Modal, Form, Dropdown } from 'semantic-ui-react';
import { useNavigate } from 'react-router-dom';
import './Projects.css';

const Projects = ({ userRole }) => { // Receive userRole as a prop
  const navigate = useNavigate(); // For navigation
  const [open, setOpen] = useState(false); // State to control modal visibility
  const [allocation, setAllocation] = useState(''); // State for allocation dropdown
  const [selectedClient, setSelectedClient] = useState(''); // State for selected client
  const [selectedProject, setSelectedProject] = useState(''); // State for selected project
  const [clientData, setClientData] = useState([]);
  const [benchedEmployees, setBenchedEmployees] = useState([]);
  const [filter, setFilter] = useState('allocated'); // Default filter is "allocated"
  const [loading, setLoading] = useState(true); // Loading state

  // Fetch data from APIs
  useEffect(() => {
    const fetchEmployeeData = async () => {
      try {
        setLoading(true);
        const allocatedResponse = await fetch('http://localhost:5000/clients');
        const benchedResponse = await fetch('http://localhost:5000/employees/todo');
        
        if (!allocatedResponse.ok || !benchedResponse.ok) {
          throw new Error('Network response was not ok');
        }

        const allocatedData = await allocatedResponse.json();
        const benchedData = await benchedResponse.json();

        setClientData(allocatedData);
        setBenchedEmployees(benchedData);
      } catch (error) {
        console.error('Fetch error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEmployeeData();
  }, []);

  const allocationOptions = [
    { key: 'client', text: 'Client Project', value: 'client project' },
    { key: 'bench', text: 'Bench', value: 'bench' },
    { key: 'corporate', text: 'Corporate', value: 'corporate' },
  ];

  // Options for client dropdown
  const clientOptions = clientData.map((client) => ({
    key: client.id,
    text: client.company,
    value: client.id,
  }));

  // Options for project dropdown based on selected client
  const projectOptions = selectedClient
    ? clientData
        .find((client) => client.id === selectedClient)
        ?.projects.map((project) => ({
          key: project,
          text: project,
          value: project,
        }))
    : [];

  const handleRowClick = (clientId) => {
    navigate(`/client/${clientId}/projects`); // Navigate to the client projects page
  };

  const handleAllocationChange = (e, { value }) => {
    setAllocation(value);
    if (value !== 'client project') {
      setSelectedClient(''); // Reset selected client
      setSelectedProject(''); // Reset selected project
    }
  };

  const handleClientChange = (e, { value }) => {
    setSelectedClient(value);
    setSelectedProject(''); // Reset selected project when a new client is selected
  };

  const handleSubmit = () => {
    console.log({
      allocation,
      selectedClient,
      selectedProject,
    });
    setOpen(false); // Close modal after submission
  };

  // Function to handle back navigation
  const handleBackClick = () => {
    navigate(-1); // Go back to the previous page
  };

  return (
    <div className="projects-container">
      {/* Back Arrow Icon */}
      <Icon  name="arrow left" size="large" style={{ cursor: 'pointer', marginBottom: '20px' }} onClick={handleBackClick} />

      <div className="projects-header">
        <h2>Clients</h2>
        {/* Show Allocate Button only if userRole is not 'leader' */}
        {/* {userRole !== 'leader' && (
          <Button className="allocate-button" primary onClick={() => setOpen(true)}>
            Allocate Resource
          </Button>
        )} */}
      </div>
      
      <Table celled padded className="futuristic-table">
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell>Company</Table.HeaderCell>
            <Table.HeaderCell>No. of Projects</Table.HeaderCell>
            <Table.HeaderCell>Country</Table.HeaderCell>
            <Table.HeaderCell>Contract Start Date</Table.HeaderCell>
            <Table.HeaderCell>Contract End Date</Table.HeaderCell>
            <Table.HeaderCell>Headcount</Table.HeaderCell>
          </Table.Row>
        </Table.Header>

        <Table.Body>
          {clientData.map((client, index) => (
            <Table.Row
              key={index}
              onClick={() => handleRowClick(client.ClientID)} // Ensure correct navigation
              style={{ cursor: 'pointer' }}
            >
              <Table.Cell>
                <Icon name="building" /> {client.ClientName}
              </Table.Cell>
              <Table.Cell>{client.NoOfProjects}</Table.Cell>
              <Table.Cell>{client.Country}</Table.Cell>
              <Table.Cell>{client.StartDate}</Table.Cell>
              <Table.Cell>{client.EndDate}</Table.Cell>
              <Table.Cell>{client.NoOfEmployees}</Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table>

      {/* Modal for Allocating Resource */}
      <Modal
        onClose={() => setOpen(false)}
        onOpen={() => setOpen(true)}
        open={open}
        size="small"
      >
        <Modal.Header>Allocate Resource</Modal.Header>
        <Modal.Content>
          <Form>
            <Form.Input label="Resource Name" placeholder="Enter resource name" required />
            <Form.Field>
              <label>Allocation</label>
              <Dropdown
                placeholder="Select Allocation"
                fluid
                selection
                options={allocationOptions}
                value={allocation}
                onChange={handleAllocationChange}
                required
              />
            </Form.Field>
            {allocation === 'client project' && (
              <>
                <Form.Field>
                  <label>Client Name</label>
                  <Dropdown
                    placeholder="Select Client"
                    fluid
                    selection
                    options={clientOptions}
                    value={selectedClient}
                    onChange={handleClientChange}
                    required
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
                      onChange={(e, { value }) => setSelectedProject(value)}
                      required
                    />
                  </Form.Field>
                )}
              </>
            )}
            <Form.Input
              label="Percentage Allocation"
              placeholder="Enter percentage (e.g., 50%)"
              type="number"
              min="0"
              max="100"
              required
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
    </div>
  );
};

export default Projects;
