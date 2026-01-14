import React, { useContext, useRef } from "react";
import "bootstrap/dist/css/bootstrap.css";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import "../css/App.css";
import { Link, useNavigate } from "react-router-dom";
import { addproject } from "../controllers/projectops";
import backicon from "../../assets/backicon.png";
import { ProjectContext } from "../controllers/ProjectContext";
import { currentAuthenticatedUser } from "../controllers/config";

export default function ProjectForm() {

  const { addProjectToList }=useContext(ProjectContext); //project context for sidebar - to add project on create
  const nameref=useRef(""); //for project name in form
  const descref=useRef(""); //for project description in form
  const navigate=useNavigate(); //to navigate to specefic route


  async function handleSubmit(e) {
    e.preventDefault(); //prevent form to submit
    const name=nameref.current.value;
    const desc=descref.current.value;
    // console.log(name);
    // console.log(desc);
    const response= await addproject(name,desc); //api call to add project in table
    console.log(response[0]); //response returns project id 
    const Project_Id=response[0].Project_Id;
    const { username, userId, signInDetails } =await currentAuthenticatedUser();
    const ProjectOwnerEmail=signInDetails.loginId;
    addProjectToList(Project_Id,name,desc,ProjectOwnerEmail); //add project to context
    navigate(`/projects/${Project_Id}/overview`,{replace:true}); //navigate to route

  }
  return (
    <div className="project-form-container">
      <div className="project-form-heading">
        <Link to="/">
        <img className="back-icon" src={backicon}></img>
        </Link>
        <div className="newproject-head">New Project</div>
      </div>
      <Form onSubmit={handleSubmit}>
        <Form.Group className="form-groups">
          <Form.Label>Project Name:</Form.Label>
          <Form.Control
            className="form-control"
            type="text"
            placeholder="Enter Project Name"
            id="ProjectName"
            name="ProjectName"
            onInvalid={(e)=>e.target.setCustomValidity('Please Enter a Project Name')} //display if no value enetered for project name
            onInput={(e)=>e.target.setCustomValidity('')} 
            ref={nameref}
            required
            autoComplete="Off" 
          />
        </Form.Group>
        <Form.Group className="form-groups">
          <Form.Label>Project Description:</Form.Label>
          <Form.Control
            as="textarea"
            rows={5}
            placeholder="Enter Project Description"
            className="form-control"
            id="ProjectDescription"
            name="ProjectDescription"
            autoComplete="Off"
            ref={descref}
          />
        </Form.Group>
        <Form.Group className="form-groups create-project-btn">
          <Button type="submit" className="btn" variant="dark">
            Create Project
          </Button>
        </Form.Group>
      </Form>
    </div>
  
  );
}
