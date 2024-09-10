import React, { useState } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import Login from './pages/Login';
import DashboardBizOps from './pages/DashboardBizOps';
import Unallocated from './pages/Unallocated';
import EmployeeDetails from './pages/EmployeeDetails';
import ClientProjects from './pages/ClientProjects';
import ClientDetails from './pages/ClientDetails';
import ToDoPage from './pages/ToDoPage';
import Reports from './pages/Reports';
import EmpPage from './pages/EmpPage'; // Import the new page

const App = () => {
  const [userRole, setUserRole] = useState(null); // State to manage user role

  return (
    <Router>
      {!userRole ? (
        <Routes>
          <Route path="/" element={<Login setUserRole={setUserRole} />} /> {/* Pass setUserRole to Login */}
        </Routes>
      ) : (
        <>
          {/* Pass userRole and setUserRole to Navbar for conditional rendering */}
          <Navbar userRole={userRole} setUserRole={setUserRole} /> {/* Pass setUserRole to Navbar */}
          <div style={{ marginLeft: '220px', padding: '20px', width: '100%' }}>
            <Routes>
              {userRole === 'leader' && (
                <>
                  {/* Routes specific to the leader role */}
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/projects" element={<Projects />} />
                  <Route path="/reports" element={<Reports userRole={userRole} />} />
                </>
              )}
              {userRole === 'bizops' && (
                <>
                  {/* Routes specific to the bizops role */}
                  <Route path="/projects" element={<Projects />} />
                  <Route path="/dashboardbizops" element={<DashboardBizOps />} />
                  <Route path="/unallocated" element={<Unallocated />} />
                  <Route path="/todo" element={<ToDoPage />} />
                  <Route path="/employees" element={<EmpPage />} /> {/* Updated route to /employees */}
                  <Route path="/reports" element={<Reports userRole={userRole} />} />
                </>
              )}
              {/* Common Routes for both roles */}
              <Route path="/employee/:id" element={<EmployeeDetails userRole={userRole} />} />
              <Route path="/client/:clientId/projects" element={<ClientProjects />} />
              <Route path="/client/:clientId/project/:projectId" element={<ClientDetails />} />
            </Routes>
          </div>
        </>
      )}
    </Router>
  );
};

export default App;
