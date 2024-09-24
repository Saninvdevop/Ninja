// src/components/AllocationManager/AllocationManager.jsx

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AllocationModal from '../AllocationModal/AllocationModal';
import { Button, Table, Loader, Message, Icon } from 'semantic-ui-react';

const AllocationManager = ({ userRole }) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [initialData, setInitialData] = useState(null);
  const [clientOptions, setClientOptions] = useState([]);
  const [projectOptions, setProjectOptions] = useState([]);
  const [employeeData, setEmployeeData] = useState([]);
  const [allocations, setAllocations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch data on mount
  useEffect(() => {
    fetchModalData();
  }, []);

  const fetchModalData = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/modal/data');
      const { projects, employees, allocations } = response.data;

      // Prepare clientOptions
      const uniqueClients = [...new Set(projects.map(p => JSON.stringify({ ClientID: p.ClientID, ClientName: p.ClientName })))].map(str => JSON.parse(str));

      const clientOpts = uniqueClients.map(client => ({
        key: client.ClientID,
        text: client.ClientName,
        value: client.ClientID,
      }));

      // Prepare projectOptions
      const projectOpts = projects.map(project => ({
        key: project.ProjectID,
        text: project.ProjectName,
        value: project.ProjectID,
        ClientID: project.ClientID, // To filter projects based on client selection
      }));

      setClientOptions(clientOpts);
      setProjectOptions(projectOpts);
      setEmployeeData(employees);
      setAllocations(allocations);
    } catch (err) {
      console.error('Error fetching modal data:', err);
      setError('Failed to load data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = () => {
    setInitialData(null); // Reset for adding new allocation
    setModalOpen(true);
  };

  const handleEditAllocation = async (allocationId) => {
    setLoading(true);
    try {
      const response = await axios.get(`/modal/data/${allocationId}`);
      setInitialData(response.data);
      setModalOpen(true);
    } catch (err) {
      console.error('Error fetching allocation details:', err);
      setError('Failed to load allocation details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAllocation = async (payload) => {
    try {
      if (payload.AllocationID) {
        // Update existing allocation
        await axios.put(`/allocations/${payload.AllocationID}`, payload);
        // Update allocations state
        setAllocations(prev =>
          prev.map(allocation =>
            allocation.AllocationID === payload.AllocationID ? { ...allocation, ...payload } : allocation
          )
        );
      } else {
        // Create new allocation
        const response = await axios.post('/allocations', payload);
        // Add new allocation to state
        setAllocations(prev => [...prev, response.data]);
      }
      setModalOpen(false);
    } catch (err) {
      console.error('Error saving allocation:', err);
      setError('Failed to save allocation. Please try again.');
    }
  };

  if (loading) return <Loader active inline="centered" />;

  return (
    <div style={{ padding: '20px' }}>
      <Button primary onClick={handleOpenModal} style={{ marginBottom: '20px' }}>
        <Icon name="add" /> Add New Allocation
      </Button>
      
      {error && <Message negative>{error}</Message>}

      <Table celled>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell>Allocation ID</Table.HeaderCell>
            <Table.HeaderCell>Employee</Table.HeaderCell>
            <Table.HeaderCell>Client</Table.HeaderCell>
            <Table.HeaderCell>Project</Table.HeaderCell>
            <Table.HeaderCell>Status</Table.HeaderCell>
            <Table.HeaderCell>Actions</Table.HeaderCell>
          </Table.Row>
        </Table.Header>

        <Table.Body>
          {allocations.map(allocation => (
            <Table.Row key={allocation.AllocationID}>
              <Table.Cell>{allocation.AllocationID}</Table.Cell>
              <Table.Cell>{allocation.EmployeeName}</Table.Cell>
              <Table.Cell>{allocation.ClientName}</Table.Cell>
              <Table.Cell>{allocation.ProjectName}</Table.Cell>
              <Table.Cell>{allocation.AllocationStatus}</Table.Cell>
              <Table.Cell>
                <Button icon labelPosition="left" onClick={() => handleEditAllocation(allocation.AllocationID)}>
                  <Icon name="edit" />
                  Edit
                </Button>
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table>

      <AllocationModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSaveAllocation}
        employeeData={employeeData}
        clientOptions={clientOptions}
        projectOptions={projectOptions}
        allocationData={initialData} // Pass allocation details when editing
        userRole={userRole}
      />
    </div>
  );
};

export default AllocationManager;
