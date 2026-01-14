import { useEffect } from 'react';
import React, { useContext, useState } from 'react';
import { Container } from 'react-bootstrap';
import '../css/App.css';
import {Link } from 'react-router-dom';
import homeicon from "../../assets/homeicon.png";
import projecticon from "../../assets/projecticon.png";
import addicon from "../../assets/addicon.png"
import {ProjectContext} from '../controllers/ProjectContext'

const SideBar = () => {

  const { projects, setProjects,fetchProjects } = useContext(ProjectContext); //project context
  const [dropdownState, setDropdownState] = useState(false);

  async function displayprojects() //onclick to dropdown
  {
    fetchProjects();
    console.log(projects);
    if (!dropdownState)  //toggle dropdown
      {
      setDropdownState(true);
    } else setDropdownState(false);
  }

    return (
    <>
    <div className="sidebar-container" style={{ display: "block" }}>
    <br/>
      <Container>
      <ul className="sidebar-ul">
        <li key="Home" className='sidebar-li'>
        <Link className="routelink" to="/">
        <img className="sidebar-icons" src={homeicon}></img>
          <div>Home</div>
        </Link>
          </li>
        <br/>
        <li key="Projects" className='project-li-container'>
          <div className='project-li'>
          <img className="sidebar-icons" src={projecticon} onClick={()=>{displayprojects()}}></img>
          <div onClick={()=>{displayprojects()}}>Project</div>
          <Link className="routelink" to="/createproject">
          <img className="addicon" src={addicon}></img>
          </Link>
          </div>
          <div className='display-project-container'>
            <ul className='display-project-ul' >
              { //if dropdown state=true, project array is not empty then display all projects
                dropdownState && projects?.length!=0 && projects.map((project)=>
                  <Link key={project.Project_Id} to={`/projects/${project.Project_Id}/overview`}>
                  <li className='display-project-li'>{project.Project_Name}</li>
                  </Link>
                )
              }
            </ul>
          </div>
        </li>
      </ul>
      </Container>
      </div>
    </>
  );
};


export default SideBar;
