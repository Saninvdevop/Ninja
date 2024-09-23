// src/pages/EmployeeDetails.jsx

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Icon, Table, Button, Popup, Message } from 'semantic-ui-react';
import './EmployeeDetails.css';
import { IoSaveOutline } from "react-icons/io5"; // Import Save Icon
import { IoMdClose } from "react-icons/io"; // Import Discard Icon
import { MdCheck } from "react-icons/md";
import AllocationDonutChart from '../components/AllocationDonutChart/Allocationdonutchart';
import * as XLSX from 'xlsx'; // Import SheetJS
import { saveAs } from 'file-saver'; // Import FileSaver
import AllocationModal from '../components/AllocationModal/AllocationModal'; // Import the new modal component
import axios from 'axios'; // Using axios for HTTP requests
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const EmployeeDetails = ({ userRole }) => {  // Accept userRole as a prop
  const { id } = useParams(); 
  const [error, setError] = useState(null);
  const navigate = useNavigate(); // Initialize useNavigate for navigation
  
  const [employeeData, setEmployeeData] = useState(null); // State for employee details
  const [allocations, setAllocations] = useState([]); // Allocations data
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false); // State to control modal visibility
  const [currentAllocation, setCurrentAllocation] = useState(0); // State for current allocation percentage
  const [filter, setFilter] = useState('active'); // Set default filter to 'active'
  const [allocationToEdit, setAllocationToEdit] = useState(null); // State to hold allocation data for editing

  // Pending changes
  const [pendingAdditions, setPendingAdditions] = useState([]);
  const [pendingEdits, setPendingEdits] = useState([]);
  const [pendingDeletions, setPendingDeletions] = useState([]);

  // Fetch employee data from API
  const fetchEmployeeData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`http://localhost:8080/employee-details/${id}`);
      setEmployeeData(response.data);
    } catch (err) {
      console.error('Error fetching employee data:', err);
      setError('Failed to load employee data');
    } finally {
      setLoading(false);
    }
  };

  // Fetch allocations based on filter
  const fetchAllocations = async (currentFilter) => {
    try {
      setLoading(true);
      const response = await axios.get(`http://localhost:8080/employee-details/${id}/allocations`, {
        params: { filter: currentFilter },
      });
      setAllocations(response.data.allocations);
      setCurrentAllocation(response.data.currentAllocation);
    } catch (err) {
      console.error('Error fetching allocations:', err);
      setError('Failed to load allocations');
    } finally {
      setLoading(false);
    }
  };

  // Fetch allocations and employee data on component mount and when filter changes
  useEffect(() => {
    fetchEmployeeData();
    fetchAllocations(filter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, filter]);

  // Handle opening the modal for adding a new allocation
  const handleOpenModal = () => {
    setAllocationToEdit(null); // Reset any previous allocation data
    setModalOpen(true); // Open the modal
  };

  // Handle opening the modal for editing an existing allocation
  const handleEditAllocation = (allocation) => {
    setAllocationToEdit(allocation);
    setModalOpen(true);
  };

  // Handle saving (both adding and editing) an allocation
  const handleSaveAllocation = async (payload) => {
    if (payload.AllocationID) {
      // Editing an existing allocation
      setPendingEdits((prev) => [...prev, payload]);
    } else {
      // Adding a new allocation
      setPendingAdditions((prev) => [...prev, payload]);
    }
    
    setModalOpen(false); // Close the modal after adding/editing
  };

  // Handle deletion of an allocation
  const handleDeleteAllocation = (allocationId) => {
    setPendingDeletions((prev) => [...prev, allocationId]);
  };

  // Handle committing changes (Save to Draft / Submit)
  const handleCommitChanges = async (commitType) => {
    try {
      // Process Pending Additions
      for (const addition of pendingAdditions) {
        await axios.post('http://localhost:8080/api/allocate', addition);
      }

      // Process Pending Edits
      for (const edit of pendingEdits) {
        await axios.put(`http://localhost:8080/allocations/${edit.AllocationID}`, edit);
      }

      // Process Pending Deletions
      for (const deletionId of pendingDeletions) {
        await axios.delete(`http://localhost:8080/allocations/${deletionId}`);
      }

      // Clear pending changes after successful commit
      setPendingAdditions([]);
      setPendingEdits([]);
      setPendingDeletions([]);

      // Refresh allocations from backend
      fetchAllocations(filter);

      // Optionally, display a success message based on commitType
      if (commitType === 'draft') {
        toast.success('Allocations saved as draft successfully!');
      } else if (commitType === 'submit') {
        toast.success('Allocations submitted successfully!');
      }
      

      setError(null); // Clear any previous errors
    } catch (err) {
      console.error('Error committing allocations:', err);
      toast.error('Failed to commit allocations. Please try again.');
    }
  };

  // Handle discarding changes
  const handleDiscardChanges = () => {
    // Clear all pending changes
    setPendingAdditions([]);
    setPendingEdits([]);
    setPendingDeletions([]);

    // Optionally, prompt the user to confirm discarding changes
    if (window.confirm('Are you sure you want to discard all unsaved changes?')) {
      navigate(-1); // Go back to the previous page
    }
  };

  // Handle back navigation with discard logic
  const handleBackClick = () => {
    if (pendingAdditions.length > 0 || pendingEdits.length > 0 || pendingDeletions.length > 0) {
      const confirmDiscard = window.confirm('You have unsaved changes. Do you want to discard them?');
      if (!confirmDiscard) return;
    }

    // Discard changes
    setPendingAdditions([]);
    setPendingEdits([]);
    setPendingDeletions([]);

    navigate(-1); // Go back to the previous page
  };

  // Handle Excel download
  const handleDownloadExcel = async () => {
    if (!employeeData) return; // Ensure employee data is available

    try {
      // Define the filters
      const filtersList = ['active', 'closed', 'all'];
      
      // Prepare an array of fetch promises
      const fetchPromises = filtersList.map(filterType =>
        axios.get(`http://localhost:8080/employee-details/${id}/allocations`, {
          params: { filter: filterType },
        })
          .then(response => response.data)
      );

      // Wait for all fetches to complete
      const results = await Promise.all(fetchPromises);

      // Create a new workbook
      const workbook = XLSX.utils.book_new();

      // Map each result to its corresponding filter
      results.forEach((data, index) => {
        const filterType = filtersList[index];
        const sheetName = filterType.charAt(0).toUpperCase() + filterType.slice(1); // Capitalize first letter

        // Convert allocations data to worksheet
        const worksheetData = data.allocations.map(alloc => ({
          'Allocation ID': alloc.AllocationID,
          'Client ID': alloc.ClientID,
          'Client Name': alloc.ClientName,
          'Project ID': alloc.ProjectID,
          'Project Name': alloc.ProjectName,
          'Allocation Status': alloc.AllocationStatus,
          'Allocation %': alloc.AllocationPercent,
          'Billing Type': alloc.AllocationBillingType,
          'Billed Check': alloc.AllocationBilledCheck,
          'Billing Rate': alloc.AllocationBillingRate,
          'TimeSheet Approver': alloc.AllocationTimeSheetApprover,
          'Start Date': alloc.AllocationStartDate,
          'End Date': alloc.AllocationEndDate,
          'Modified By': alloc.ModifiedBy,
          'Modified At': alloc.ModifiedAt,
        }));

        const worksheet = XLSX.utils.json_to_sheet(worksheetData);

        // Append worksheet to workbook with the sheet name
        XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
      });

      // Generate buffer
      const workbookOut = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });

      // Create a Blob from the buffer
      const blob = new Blob([workbookOut], { type: 'application/octet-stream' });

      // Trigger the download using FileSaver
      saveAs(blob, `${employeeData.EmployeeName}_Allocations.xlsx`);
    } catch (err) {
      console.error('Error during Excel download:', err);
      setError('Failed to download allocations');
    }
  };

  // Sorting logic
  const [sortColumn, setSortColumn] = useState(null);
  const [sortDirection, setSortDirection] = useState(null); 

  const handleSort = (column) => {
    let direction = 'ascending';
    if (sortColumn === column && sortDirection === 'ascending') {
      direction = 'descending';
    }
    const sortedData = [...allocations].sort((a, b) => {
      if (a[column] === null) return 1;
      if (b[column] === null) return -1;
      if (a[column] === b[column]) return 0;
      if (direction === 'ascending') {
        return a[column] > b[column] ? 1 : -1;
      }
      return a[column] < b[column] ? 1 : -1;
    });
    setAllocations(sortedData);
    setSortColumn(column);
    setSortDirection(direction);
  };

  const renderSortIcon = (column) => {
    if (sortColumn !== column) return null;
    if (sortDirection === 'ascending') {
      return <Icon name="sort up" />;
    } else {
      return <Icon name="sort down" />;
    }
  };

  // Helper function to generate default image based on employee name
  const getDefaultImage = (name) => {
    if (!name) return 'https://via.placeholder.com/150';
    const firstChar = name.charAt(0).toUpperCase();
    // Replace this URL with your logic to generate images based on the first character
    return `https://ui-avatars.com/api/?name=${firstChar}&background=random&size=150`;
  };

  // Merge allocations with pending changes
  const mergedAllocations = allocations.map((alloc) => {
    // Check if there's a pending edit for this allocation
    const pendingEdit = pendingEdits.find((edit) => edit.AllocationID === alloc.AllocationID);
    return pendingEdit ? { ...alloc, ...pendingEdit } : alloc;
  });

  // Include pending additions and exclude pending deletions
  const finalAllocations = [
    ...mergedAllocations.filter((alloc) => !pendingDeletions.includes(alloc.AllocationID)),
    ...pendingAdditions.map((alloc, index) => ({ ...alloc, AllocationID: `new-${index}` })), // Assign temporary IDs for new allocations
  ];

  return (
    <div className="main-layout">
      <div className='right-content'>
        <div className='breadcrumb'>
          {/* Back Arrow Icon */}
          <Icon 
            name="arrow left" 
            size="large" 
            className="icon"
            onClick={handleBackClick} 
          />
          
          {/* Previous Screen Link */}
          <h2 
            className="breadcrumb-text" 
            onClick={() => navigate('/employees')}
          >
            Employees
          </h2>
          
          {/* Divider between breadcrumb items */}
          <span className="breadcrumb-divider"> / </span>
          
          {/* Current Employee Name */}
          <h2 className="breadcrumb-text">
            {employeeData ? employeeData.EmployeeName : "Employee Details"}
          </h2>
          
          {/* Save and Discard Buttons (Right Aligned) */}
          <div className='breadcrumb-actions'>
            <Popup
              content="Discard Changes"
              trigger={
                <Button 
                  icon={<IoMdClose size={24} />} // Discard Icon
                  onClick={handleDiscardChanges} 
                />
              }
            />
            {/* Conditionally render the Save/Submit button based on allocation percentage */}
            {currentAllocation === 100 ? (
              <Popup
                content="Submit Allocations"
                trigger={
                  <Button
                    style={{ backgroundColor: 'green', color: 'white' }}
                    icon={<MdCheck size={24} />}
                    onClick={() => handleCommitChanges('submit')}
                  />
                }
              />
            ) : (
              <Popup
                content="Save to Draft"
                trigger={
                  <Button
                    style={{ backgroundColor: 'black', color: 'white' }}
                    icon={<IoSaveOutline size={24} />}
                    onClick={() => handleCommitChanges('draft')}
                  />
                }
              />
            )}
          </div>
        </div>
        
        {loading && <p>Loading...</p>}
        {error && <Message negative>{error}</Message>}
        
        {!loading && employeeData && (
          <div className='middle-content'>
            <div className="employee-card">
              <div className="card-header">
                {/* Employee Image or Default Image */}
                <img 
                  src={employeeData.EmployeePhotoDetails ? employeeData.EmployeePhotoDetails : getDefaultImage(employeeData.EmployeeName)} 
                  alt="Employee Profile" 
                  className="profile-img" 
                />
                <div className="employee-info">
                  {/* Employee Name */}
                  <h2>{employeeData.EmployeeName}</h2>
                  {/* Employee ID */}
                  <p className="employee-id">ID: {employeeData.EmployeeId}</p>
                </div>
                {/* Info Icon with Popup */}
                <Popup
                  trigger={<i className="info icon" style={{ cursor: 'pointer', fontSize: '1.5em' }} />}
                  content={
                    <div>
                      <p><strong>Joining Date:</strong> {new Date(employeeData.EmployeeJoiningDate).toLocaleDateString()}</p>
                      <p><strong>Ending Date:</strong> {employeeData.EmployeeEndingDate ? new Date(employeeData.EmployeeEndingDate).toLocaleDateString() : 'N/A'}</p>
                      <p><strong>TYOE:</strong> {employeeData.EmployeeTYOE} {employeeData.EmployeeRole}</p>
                      <p><strong>Skills:</strong> {employeeData.EmployeeSkills}</p>
                      <p><strong>Contract Type:</strong> {employeeData.EmployeeContractType}</p>
                    </div>
                  }
                  position="top right"
                  on="click" // Click to show the popup
                />
              </div>

              <div className="top-info">
                <div className="info-item">
                  <Icon name="briefcase" size="large" />
                  <div>
                    <p>Role</p>
                    {/* Employee Role */}
                    <p>{employeeData.EmployeeRole}</p>
                  </div>
                </div>

                <div className="info-item">
                  <Icon name="building" size="large" />
                  <div>
                    <p>Studio</p>
                    {/* Employee Studio */}
                    <p>{employeeData.EmployeeStudio}</p>
                  </div>
                </div>

                <div className="info-item">
                  <Icon name="chart line" size="large" />
                  <div>
                    <p>Sub-studio</p>
                    {/* Employee Sub-Studio */}
                    <p>{employeeData.EmployeeSubStudio}</p>
                  </div>
                </div>
                <div className="info-item">
                  <Icon name="mail" size="large" />
                  <div>
                    <p>Email</p>
                    {/* Employee Email */}
                    <p>{employeeData.EmployeeEmail}</p>
                  </div>
                </div>

                <div className="info-item">
                  <Icon name="phone" size="large" />
                  <div>
                    <p>Keka Status</p>
                    {/* Employee Keka Status */}
                    <p>{employeeData.EmployeeKekaStatus}</p>
                  </div>
                </div>

                <div className="info-item">
                  <Icon name="map marker alternate" size="large" />
                  <div>
                    <p>Location</p>
                    {/* Employee Location */}
                    <p>{employeeData.EmployeeLocation}</p>
                  </div>
                </div>
              </div>
              {/* Buttons Section */}
              <div className="button-section">
                <Button primary icon="download" content="Download" onClick={handleDownloadExcel}/>
                {userRole === 'bizops' && (
                  <Button positive icon="plus" onClick={handleOpenModal} content="Allocate Resource" />
                )}
              </div>
            </div>
            <div className="allocation-chart">
              <AllocationDonutChart 
                total={currentAllocation} 
                dataValues={[currentAllocation, 100 - currentAllocation]} 
                labels={['Allocated', 'Unallocated']} 
                colors={
                  currentAllocation === 100
                    ? ['#77dd77', '#e0e0e0'] // Green if 100% allocated
                    : currentAllocation === 0
                    ? ['#FF0000', '#e0e0e0'] // Red if 0% allocated
                    : ['#FFA500', '#e0e0e0'] // Orange for partial allocation
                }
              />
            </div>
          </div>
        )}
        
        {!loading && employeeData && (
          <div className="bottom-content">
            <div className='table-filter-layout'>
              {/* Filter Tabs */}
              <div className="filter-tabs">
                <button
                  className={`tab ${filter === 'active' ? 'active' : ''}`}
                  onClick={() => setFilter('active')}
                >
                  Active
                </button>
                <button
                  className={`tab ${filter === 'closed' ? 'active' : ''}`}
                  onClick={() => setFilter('closed')}
                >
                  Closed
                </button>
                <button
                  className={`tab ${filter === 'all' ? 'active' : ''}`}
                  onClick={() => setFilter('all')}
                >
                  All
                </button>
              </div>
            </div>
            <div className='table-container'> {/* Add a container for horizontal scrolling */}
              <Table celled sortable>
                <Table.Header>
                  <Table.Row>
                    <Table.HeaderCell onClick={() => handleSort('AllocationID')}>
                      Allocation ID {renderSortIcon('AllocationID')}
                    </Table.HeaderCell>
                    <Table.HeaderCell onClick={() => handleSort('ClientID')}>
                      Client ID {renderSortIcon('ClientID')}
                    </Table.HeaderCell>
                    <Table.HeaderCell onClick={() => handleSort('ClientName')}>
                      Client Name {renderSortIcon('ClientName')}
                    </Table.HeaderCell>
                    <Table.HeaderCell onClick={() => handleSort('ProjectID')}>
                      Project ID {renderSortIcon('ProjectID')}
                    </Table.HeaderCell>
                    <Table.HeaderCell onClick={() => handleSort('ProjectName')}>
                      Project Name {renderSortIcon('ProjectName')}
                    </Table.HeaderCell>
                    <Table.HeaderCell onClick={() => handleSort('AllocationStatus')}>
                      Allocation Status {renderSortIcon('AllocationStatus')}
                    </Table.HeaderCell>
                    <Table.HeaderCell onClick={() => handleSort('AllocationPercent')}>
                      Allocation % {renderSortIcon('AllocationPercent')}
                    </Table.HeaderCell>
                    <Table.HeaderCell onClick={() => handleSort('AllocationBillingType')}>
                      Billing Type {renderSortIcon('AllocationBillingType')}
                    </Table.HeaderCell>
                    <Table.HeaderCell onClick={() => handleSort('AllocationBilledCheck')}>
                      Billed Check {renderSortIcon('AllocationBilledCheck')}
                    </Table.HeaderCell>
                    <Table.HeaderCell onClick={() => handleSort('AllocationBillingRate')}>
                      Billing Rate {renderSortIcon('AllocationBillingRate')}
                    </Table.HeaderCell>
                    <Table.HeaderCell onClick={() => handleSort('AllocationTimeSheetApprover')}>
                      TimeSheet Approver {renderSortIcon('AllocationTimeSheetApprover')}
                    </Table.HeaderCell>
                    <Table.HeaderCell onClick={() => handleSort('AllocationStartDate')}>
                      Start Date {renderSortIcon('AllocationStartDate')}
                    </Table.HeaderCell>
                    <Table.HeaderCell onClick={() => handleSort('AllocationEndDate')}>
                      End Date {renderSortIcon('AllocationEndDate')}
                    </Table.HeaderCell>
                    <Table.HeaderCell onClick={() => handleSort('ModifiedBy')}>
                      Modified By {renderSortIcon('ModifiedBy')}
                    </Table.HeaderCell>
                    <Table.HeaderCell onClick={() => handleSort('ModifiedAt')}>
                      Modified At {renderSortIcon('ModifiedAt')}
                    </Table.HeaderCell>
                    <Table.HeaderCell>Actions</Table.HeaderCell>
                  </Table.Row>
                </Table.Header>

                <Table.Body>
                  {finalAllocations.length > 0 ? (
                    finalAllocations.map((alloc) => (
                      <Table.Row key={alloc.AllocationID || `new-${alloc.ProjectID}-${alloc.EmployeeID}`}>
                        <Table.Cell>{alloc.AllocationID || 'N/A'}</Table.Cell>
                        <Table.Cell>{alloc.ClientID}</Table.Cell>
                        <Table.Cell>{alloc.ClientName}</Table.Cell>
                        <Table.Cell>{alloc.ProjectID}</Table.Cell>
                        <Table.Cell>{alloc.ProjectName}</Table.Cell>
                        <Table.Cell>{alloc.AllocationStatus}</Table.Cell>
                        <Table.Cell>{alloc.AllocationPercent}%</Table.Cell>
                        <Table.Cell>{alloc.AllocationBillingType}</Table.Cell>
                        <Table.Cell>{alloc.AllocationBilledCheck}</Table.Cell>
                        <Table.Cell>${alloc.AllocationBillingRate.toFixed(2)}</Table.Cell>
                        <Table.Cell>{alloc.AllocationTimeSheetApprover}</Table.Cell>
                        <Table.Cell>{new Date(alloc.AllocationStartDate).toLocaleDateString()}</Table.Cell>
                        <Table.Cell>{alloc.AllocationEndDate ? new Date(alloc.AllocationEndDate).toLocaleDateString() : 'N/A'}</Table.Cell>
                        <Table.Cell>{alloc.ModifiedBy}</Table.Cell>
                        <Table.Cell>{new Date(alloc.ModifiedAt).toLocaleString()}</Table.Cell>
                        <Table.Cell>
                          {userRole === 'bizops' && (
                            <>
                              {/* Disable Edit/Delete for new allocations */}
                              {!alloc.AllocationID && <span>N/A</span>}
                              {alloc.AllocationID && (
                                <>
                                  <Button 
                                    icon="edit" 
                                    onClick={() => handleEditAllocation(alloc)} 
                                    title="Edit Allocation"
                                  />
                                  <Button 
                                    icon="trash" 
                                    color="red" 
                                    onClick={() => handleDeleteAllocation(alloc.AllocationID)} 
                                    title="Delete Allocation"
                                  />
                                </>
                              )}
                            </>
                          )}
                        </Table.Cell>
                      </Table.Row>
                    ))
                  ) : (
                    <Table.Row>
                      <Table.Cell colSpan="16" textAlign="center"> {/* Updated colSpan to 16 to include new columns */}
                        No allocations found.
                      </Table.Cell>
                    </Table.Row>
                  )}
                </Table.Body>
              </Table>
            </div>
          </div>
        )}
      </div>
      
      {/* Allocation Modal */}
      <AllocationModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSaveAllocation}
        employeeData={employeeData} // Pass the employee object
        allocationData={allocationToEdit} // Pass allocation details when editing
        userRole={userRole}
      />
    </div>
  );
}
  export default EmployeeDetails;