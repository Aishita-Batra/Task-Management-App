// import  ErrorPage  from './ErrorPage';
import { useState } from "react";
import "../css/App.css";
import { Amplify } from "aws-amplify";
import { withAuthenticator } from "@aws-amplify/ui-react";
import "@aws-amplify/ui-react/styles.css";
import {
  ConfigureAPI,
  ConfigureCognito,
  currentAuthenticatedUser,
  currentSession,
  setSessionStorage,
} from "../controllers/config.jsx";
import { useEffect } from "react";
import MyNavBar from "../components/MyNavbar.jsx";
import MainContent from "../components/MainContent.jsx";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ProjectForm from "../components/ProjectForm.jsx";
import { Navbar } from "react-bootstrap";
import { ProjectProvider } from "../controllers/ProjectContext.jsx";
import ProjectOverview from "../components/ProjectOverview.jsx";
import Sidebar from "../components/Sidebar.jsx";
import MyTeam from "../components/MyTeam.jsx";
import File from "../components/File.jsx"


//cognito configuration and add user data in session storage
ConfigureCognito();
setSessionStorage();

function App({ signOut, user }) {
 

  return (
    <>
    <BrowserRouter>
    <MyNavBar signOut={signOut} user={user} />
    <div className="app-bottom-container d-flex h-80">
    <ProjectProvider>
      <Sidebar />
      <div className="content-container">
    <Routes>
          <Route path="/" element={<MainContent/>} />
          <Route path="/createproject" element={<ProjectForm/>} />
          <Route path="/projects/:project_id/*" element={<ProjectOverview />}/>
          <Route path="/projects/:project_id/:viewname/*" element={<ProjectOverview />}/>
          <Route path="/projects/:project_id/member" element={<MyTeam/>}/>
          <Route path="/projects/:project_id/tasks/:task_id/file" element={<File/>}/>
      </Routes>  
      </div>
      </ProjectProvider>
      </div>  
    </BrowserRouter>
    </>
  );
}

export default withAuthenticator(App);

// { hideSignUp: true }
