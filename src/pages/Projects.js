import React, { useState } from 'react';
import { Table, Icon, Button, Modal, Form, Dropdown } from 'semantic-ui-react';
import { useNavigate } from 'react-router-dom';
import './Projects.css';

const Projects = () => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false); // State to control modal visibility
  const [allocation, setAllocation] = useState(''); // State for allocation dropdown
  const [selectedClient, setSelectedClient] = useState(''); // State for selected client
  const [selectedProject, setSelectedProject] = useState(''); // State for selected project

  const clientData = [
    {
      company: 'Acme Corp',
      projects: ['Website Redesign', 'Mobile App Development'],
      status: 'In Progress',
      country: 'USA',
      contract_start_date: '2023-01-01',
      contract_end_date: '2023-12-31',
      employees: 50,
      id: 'acme-corp',
    },
    {
      company: 'Global Tech',
      projects: ['AI Research', 'Data Migration'],
      status: 'Completed',
      country: 'UK',
      contract_start_date: '2022-05-01',
      contract_end_date: '2023-04-30',
      employees: 30,
      id: 'global-tech',
    },
    {
      company: 'Healthify Inc.',
      projects: ['Health Tracking App', 'Wellness Portal'],
      status: 'In Progress',
      country: 'Canada',
      contract_start_date: '2023-03-01',
      contract_end_date: '2024-02-28',
      employees: 20,
      id: 'healthify-inc',
    },
    {
      company: 'EduPro',
      projects: ['E-learning Platform', 'Course Management System'],
      status: 'Pending',
      country: 'Australia',
      contract_start_date: '2023-06-01',
      contract_end_date: '2024-05-31',
      employees: 25,
      id: 'edupro',
    },
  ];

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

  return (
    <div className="projects-container">
      <div className="projects-header">
        <h2>Clients</h2>
        {/* <Button className="allocate-button" primary onClick={() => setOpen(true)}>
          Allocate Resource
        </Button> */}
      </div>
      <Table celled padded className="futuristic-table">
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell>Company</Table.HeaderCell>
            <Table.HeaderCell>No. of Projects</Table.HeaderCell>
            <Table.HeaderCell>Status</Table.HeaderCell>
            <Table.HeaderCell>Country</Table.HeaderCell>
            <Table.HeaderCell>Contract Start Date</Table.HeaderCell>
            <Table.HeaderCell>Contract End Date</Table.HeaderCell>
            <Table.HeaderCell>No. of Employees Working</Table.HeaderCell>
          </Table.Row>
        </Table.Header>

        <Table.Body>
          {clientData.map((client, index) => (
            <Table.Row
              key={index}
              onClick={() => handleRowClick(client.id)} // Ensure correct navigation
              style={{ cursor: 'pointer' }}
            >
              <Table.Cell>
                <Icon name="building" /> {client.company}
              </Table.Cell>
              <Table.Cell>{client.projects.length}</Table.Cell>
              <Table.Cell>
                <span className={`status ${client.status.toLowerCase().replace(' ', '-')}`}>
                  {client.status}
                </span>
              </Table.Cell>
              <Table.Cell>{client.country}</Table.Cell>
              <Table.Cell>{client.contract_start_date}</Table.Cell>
              <Table.Cell>{client.contract_end_date}</Table.Cell>
              <Table.Cell>{client.employees}</Table.Cell>
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
