// src/pages/EmployeeDetails.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Icon, Table, Button, Popup, Message, Modal } from 'semantic-ui-react';
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

  // Confirmation Modal State
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const [nextAction, setNextAction] = useState(null);

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
    if (filter !== 'staged') {
      fetchAllocations(filter);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, filter]);

  // Handle opening the modal for adding a new allocation
  const handleOpenModal = () => {
    setAllocationToEdit(null); // Reset any previous allocation data
    setModalOpen(true); // Open the modal
  };


  // Handle editing allocations (both additions and edits)
  const handleEditAllocation = (allocation, isStaged = false) => {
    setAllocationToEdit({ ...allocation, isStaged }); // Pass whether it's a staged change
    setModalOpen(true);
  };

  // Handle removing additions
  const handleRemoveAddition = (allocationId) => {
    setPendingAdditions((prev) => prev.filter((alloc) => alloc.AllocationID !== allocationId));
  };

  // Handle removing edits
  const handleRemoveEdit = (allocationId) => {
    setPendingEdits((prev) => prev.filter((alloc) => alloc.AllocationID !== allocationId));
  };

  // Handle saving (both adding and editing) an allocation
  const handleSaveAllocation = (payload) => {
    if (payload.AllocationID) {
      // Editing an existing allocation
      setPendingEdits((prev) => {
        // Avoid duplicate edits for the same AllocationID
        const existingEditIndex = prev.findIndex(edit => edit.AllocationID === payload.AllocationID);
        if (existingEditIndex !== -1) {
          const updatedEdits = [...prev];
          updatedEdits[existingEditIndex] = payload;
          return updatedEdits;
        }
        return [...prev, payload];
      });
    } else {
      // Adding a new allocation
      setPendingAdditions((prev) => [...prev, payload]);
    }
    
    setModalOpen(false); // Close the modal after adding/editing
  };

  // Handle deletion of an allocation
  const handleDeleteAllocation = (allocationId) => {
    if (!pendingDeletions.includes(allocationId)) {
      setPendingDeletions((prev) => [...prev, allocationId]);
    }
  };

  // Handle committing changes (Save to Draft / Submit)
  const handleCommitChanges = async (commitType) => {
    try {
      setLoading(true);
      // Process Pending Additions
      const additionPromises = pendingAdditions.map((addition) =>
        axios.post('http://localhost:8080/api/allocate', addition)
      );

      // Process Pending Edits
      const editPromises = pendingEdits.map((edit) =>
        axios.put(`http://localhost:8080/allocations/${edit.AllocationID}`, edit)
      );

      // Process Pending Deletions
      const deletionPromises = pendingDeletions.map((deletionId) =>
        axios.delete(`http://localhost:8080/allocations/${deletionId}`)
      );

      // Execute all promises in parallel
      await Promise.all([...additionPromises, ...editPromises, ...deletionPromises]);

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
    } finally {
      setLoading(false);
    }
  };

  // Handle discarding changes
  const confirmDiscardChanges = () => {
    setConfirmDiscard(true);
  };

  const handleConfirmDiscard = () => {
    // Clear all pending changes
    setPendingAdditions([]);
    setPendingEdits([]);
    setPendingDeletions([]);
    setConfirmDiscard(false);
    navigate(-1); // Go back to the previous page
  };

  const handleCancelDiscard = () => {
    setConfirmDiscard(false);
  };

  // Handle back navigation with discard logic
  const handleBackClick = () => {
    if (pendingAdditions.length > 0 || pendingEdits.length > 0 || pendingDeletions.length > 0) {
      setConfirmDiscard(true);
    } else {
      navigate(-1); // Go back to the previous page
    }
  };

  // Handle navigation within the app (optional, based on your routing needs)
  const handleNavigate = useCallback(
    (path) => {
      if (pendingAdditions.length > 0 || pendingEdits.length > 0 || pendingDeletions.length > 0) {
        setNextAction(() => () => {
          setFilter(path); // Example action, adjust based on actual navigation
        });
        setConfirmDiscard(true);
      } else {
        navigate(path);
      }
    },
    [navigate, pendingAdditions, pendingEdits, pendingDeletions]
  );

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

  // Calculate staged changes percentage
  const calculateStagedChangesPercent = () => {
    let additions = pendingAdditions.reduce((sum, alloc) => sum + alloc.AllocationPercent, 0);
    let edits = pendingEdits.reduce((sum, alloc) => sum + alloc.AllocationPercent, 0);
    let deletions = pendingDeletions.reduce((sum, allocId) => {
      const alloc = allocations.find(a => a.AllocationID === allocId);
      return sum + (alloc ? alloc.AllocationPercent : 0);
    }, 0);
    return additions + edits - deletions;
  };

  const stagedChangesPercent = calculateStagedChangesPercent();

  // Handle browser/tab close
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (pendingAdditions.length > 0 || pendingEdits.length > 0 || pendingDeletions.length > 0) {
        e.preventDefault();
        e.returnValue = ''; // Required for Chrome
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [pendingAdditions, pendingEdits, pendingDeletions]);

  // Prepare allocations for display based on the active filter
  const getDisplayAllocations = () => {
    if (filter === 'staged') {
      return null; // Staged changes are handled separately
    }

    // Exclude allocations marked for deletion
    const filteredAllocations = allocations.filter(
      (alloc) => !pendingDeletions.includes(alloc.AllocationID)
    );

    return filteredAllocations;
  };

  const displayAllocations = getDisplayAllocations();

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
            style={{ cursor: 'pointer' }}
          />
          
          {/* Previous Screen Link */}
          <h2 
            className="breadcrumb-text" 
            onClick={() => navigate('/employees')}
            style={{ cursor: 'pointer' }}
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
                  onClick={confirmDiscardChanges} 
                />
              }
            />
            {/* Conditionally render the Save/Submit button based on allocation percentage */}
            {currentAllocation === 100 ? (
              <Popup
                content="Submit Allocations"
                trigger={
                  <Button
                    style={{ backgroundColor: 'green', color: 'white', marginLeft: '10px' }}
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
                    style={{ backgroundColor: 'black', color: 'white', marginLeft: '10px' }}
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
                dataValues={
                  stagedChangesPercent > 0 
                    ? [currentAllocation, stagedChangesPercent, 100 - currentAllocation - stagedChangesPercent]
                    : [currentAllocation, 100 - currentAllocation]
                } 
                labels={
                  stagedChangesPercent > 0 
                    ? ['Allocated', 'Staged Changes', 'Unallocated'] 
                    : ['Allocated', 'Unallocated']
                }
                colors={
                  stagedChangesPercent > 0
                    ? [
                        currentAllocation === 100 ? '#77dd77' : currentAllocation === 0 ? '#FF0000' : '#FFA500',
                        '#FF0000', // Red for staged changes
                        '#e0e0e0'
                      ]
                    : [
                        currentAllocation === 100 ? '#77dd77' : currentAllocation === 0 ? '#FF0000' : '#FFA500',
                        '#e0e0e0'
                      ]
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
                {/* New Staged Changes Tab */}
                <button
                  className={`tab ${filter === 'staged' ? 'active' : ''}`}
                  onClick={() => setFilter('staged')}
                >
                  Staged Changes
                </button>
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
              {filter === 'staged' ? (
                <Table celled>
                <Table.Header>
                  <Table.Row>
                    <Table.HeaderCell>Change Type</Table.HeaderCell>
                    <Table.HeaderCell>Allocation ID</Table.HeaderCell>
                    <Table.HeaderCell>Client ID</Table.HeaderCell>
                    <Table.HeaderCell>Client Name</Table.HeaderCell>
                    <Table.HeaderCell>Project ID</Table.HeaderCell>
                    <Table.HeaderCell>Project Name</Table.HeaderCell>
                    <Table.HeaderCell>Allocation %</Table.HeaderCell>
                    <Table.HeaderCell>Billing Type</Table.HeaderCell>
                    <Table.HeaderCell>Billed Check</Table.HeaderCell>
                    <Table.HeaderCell>Billing Rate</Table.HeaderCell>
                    <Table.HeaderCell>TimeSheet Approver</Table.HeaderCell>
                    <Table.HeaderCell>Start Date</Table.HeaderCell>
                    <Table.HeaderCell>End Date</Table.HeaderCell>
                    <Table.HeaderCell>Modified By</Table.HeaderCell>
                    <Table.HeaderCell>Modified At</Table.HeaderCell>
                    <Table.HeaderCell>Actions</Table.HeaderCell>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {/* Pending Additions */}
                  {pendingAdditions.map((alloc, index) => (
                    <Table.Row key={`add-${alloc.AllocationID || index}`}>
                      <Table.Cell>Add</Table.Cell>
                      <Table.Cell>{alloc.AllocationID || 'N/A'}</Table.Cell>
                      <Table.Cell>{alloc.ClientID}</Table.Cell>
                      <Table.Cell>{alloc.ClientName}</Table.Cell>
                      <Table.Cell>{alloc.ProjectID}</Table.Cell>
                      <Table.Cell>{alloc.ProjectName}</Table.Cell>
                      <Table.Cell>{alloc.AllocationPercent}%</Table.Cell>
                      <Table.Cell>{alloc.AllocationBillingType}</Table.Cell>
                      <Table.Cell>{alloc.AllocationBilledCheck}</Table.Cell>
                      <Table.Cell>${alloc.AllocationBillingRate.toFixed(2)}</Table.Cell>
                      <Table.Cell>{alloc.AllocationTimeSheetApprover}</Table.Cell>
                      <Table.Cell>{new Date(alloc.AllocationStartDate).toLocaleDateString()}</Table.Cell>
                      <Table.Cell>{alloc.AllocationEndDate ? new Date(alloc.AllocationEndDate).toLocaleDateString() : 'N/A'}</Table.Cell>
                      <Table.Cell>{alloc.ModifiedBy || 'N/A'}</Table.Cell>
                      <Table.Cell>{alloc.ModifiedAt ? new Date(alloc.ModifiedAt).toLocaleString() : 'N/A'}</Table.Cell>
                      <Table.Cell>
                        <Button 
                          icon="edit" 
                          onClick={() => handleEditAllocation(alloc, true)} 
                          title="Edit Addition"
                        />
                        <Button 
                          icon="trash" 
                          color="red" 
                          onClick={() => handleRemoveAddition(alloc.AllocationID)} 
                          title="Remove Addition"
                        />
                      </Table.Cell>
                    </Table.Row>
                  ))}

                  {/* Pending Edits */}
                  {pendingEdits.map((alloc, index) => (
                    <Table.Row key={`edit-${alloc.AllocationID}-${index}`}>
                      <Table.Cell>Edit</Table.Cell>
                      <Table.Cell>{alloc.AllocationID}</Table.Cell>
                      <Table.Cell>{alloc.ClientID}</Table.Cell>
                      <Table.Cell>{alloc.ClientName}</Table.Cell>
                      <Table.Cell>{alloc.ProjectID}</Table.Cell>
                      <Table.Cell>{alloc.ProjectName}</Table.Cell>
                      <Table.Cell>{alloc.AllocationPercent}%</Table.Cell>
                      <Table.Cell>{alloc.AllocationBillingType}</Table.Cell>
                      <Table.Cell>{alloc.AllocationBilledCheck}</Table.Cell>
                      <Table.Cell>${alloc.AllocationBillingRate.toFixed(2)}</Table.Cell>
                      <Table.Cell>{alloc.AllocationTimeSheetApprover}</Table.Cell>
                      <Table.Cell>{new Date(alloc.AllocationStartDate).toLocaleDateString()}</Table.Cell>
                      <Table.Cell>{alloc.AllocationEndDate ? new Date(alloc.AllocationEndDate).toLocaleDateString() : 'N/A'}</Table.Cell>
                      <Table.Cell>{alloc.ModifiedBy || 'N/A'}</Table.Cell>
                      <Table.Cell>{alloc.ModifiedAt ? new Date(alloc.ModifiedAt).toLocaleString() : 'N/A'}</Table.Cell>
                      <Table.Cell>
                        <Button 
                          icon="edit" 
                          onClick={() => handleEditAllocation(alloc, true)} 
                          title="Edit Allocation"
                        />
                        <Button 
                          icon="trash" 
                          color="red" 
                          onClick={() => handleRemoveEdit(alloc.AllocationID)} 
                          title="Remove Edit"
                        />
                      </Table.Cell>
                    </Table.Row>
                  ))}

                  {/* Pending Deletions */}
                  {pendingDeletions.map((allocId, index) => {
                    const alloc = allocations.find(a => a.AllocationID === allocId);
                    return (
                      <Table.Row key={`del-${allocId}-${index}`}>
                        <Table.Cell>Delete</Table.Cell>
                        <Table.Cell>{allocId}</Table.Cell>
                        <Table.Cell>{alloc ? alloc.ClientID : 'N/A'}</Table.Cell>
                        <Table.Cell>{alloc ? alloc.ClientName : 'N/A'}</Table.Cell>
                        <Table.Cell>{alloc ? alloc.ProjectID : 'N/A'}</Table.Cell>
                        <Table.Cell>{alloc ? alloc.ProjectName : 'N/A'}</Table.Cell>
                        <Table.Cell>{alloc ? `${alloc.AllocationPercent}%` : 'N/A'}</Table.Cell>
                        <Table.Cell>{alloc ? alloc.AllocationBillingType : 'N/A'}</Table.Cell>
                        <Table.Cell>{alloc ? alloc.AllocationBilledCheck : 'N/A'}</Table.Cell>
                        <Table.Cell>{alloc ? `$${alloc.AllocationBillingRate.toFixed(2)}` : 'N/A'}</Table.Cell>
                        <Table.Cell>{alloc ? alloc.AllocationTimeSheetApprover : 'N/A'}</Table.Cell>
                        <Table.Cell>{alloc ? new Date(alloc.AllocationStartDate).toLocaleDateString() : 'N/A'}</Table.Cell>
                        <Table.Cell>{alloc ? (alloc.AllocationEndDate ? new Date(alloc.AllocationEndDate).toLocaleDateString() : 'N/A') : 'N/A'}</Table.Cell>
                        <Table.Cell>{alloc ? alloc.ModifiedBy : 'N/A'}</Table.Cell>
                        <Table.Cell>{alloc ? new Date(alloc.ModifiedAt).toLocaleString() : 'N/A'}</Table.Cell>
                        <Table.Cell>
                          <Button 
                            icon="undo" 
                            color="blue" 
                            onClick={() => setPendingDeletions(prev => prev.filter(id => id !== allocId))}
                            title="Undo Delete"
                          />
                        </Table.Cell>
                      </Table.Row>
                    );
                  })}

                  {/* No Staged Changes */}
                  {pendingAdditions.length === 0 && pendingEdits.length === 0 && pendingDeletions.length === 0 && (
                    <Table.Row>
                      <Table.Cell colSpan="16" textAlign="center">
                        No staged changes.
                      </Table.Cell>
                    </Table.Row>
                  )}
                </Table.Body>
              </Table>
              ) : (
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
                    {displayAllocations && displayAllocations.length > 0 ? (
                      displayAllocations.map((alloc) => (
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
              )}
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
        currentAllocation={currentAllocation} // Pass current allocation
        stagedChangesPercent={stagedChangesPercent} // Pass staged changes
      />

      {/* Confirmation Modal for Discarding Changes */}
      <Modal
        open={confirmDiscard}
        size="small"
      >
        <Modal.Header>Discard Changes</Modal.Header>
        <Modal.Content>
          <p>You have unsaved changes. Are you sure you want to discard them?</p>
        </Modal.Content>
        <Modal.Actions>
          <Button negative onClick={handleCancelDiscard}>
            No
          </Button>
          <Button positive onClick={handleConfirmDiscard}>
            Yes
          </Button>
        </Modal.Actions>
      </Modal>

      <ToastContainer />
    </div>
  );
}
export default EmployeeDetails;
