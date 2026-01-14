import React, { useState, useEffect, useContext } from "react";
import Button from "react-bootstrap/Button";
import "bootstrap/dist/css/bootstrap.min.css";
import "../css/App.css";
import Card from "react-bootstrap/Card";
import ButtonGroup from "react-bootstrap/ButtonGroup";
import {
  getproject,
  updateproject,
  deleteproject,
} from "../controllers/projectops";
import { Link, useNavigate, useParams } from "react-router-dom";
import Listicon from "../../assets/List.png";
import Fileicon from "../../assets/File.png";
import File2icon from "../../assets/File2.png";
import editicon from "../../assets/editicon.png";
import deleteicon from "../../assets/deleteicon.png";
import { ProjectContext } from "../controllers/ProjectContext";
import DeleteProjectModal from "./DeleteProjectModal";
import DisplayTasks from "./DisplayTasks";
import { currentAuthenticatedUser } from "../controllers/config";
import { Alert } from "react-bootstrap";
import File from "./File"

function ProjectOverview() {
  const [modalShow, setModalShow] = useState(false); //deleteproject modal
  const CloseDeleteModal = () => setModalShow(false); //close modal function
  const ShowDeleteModal = () => setModalShow(true); //show modal function
  const [showNotFoundAlert,setShowNotFoundAlert]=useState(false);

  const params = useParams(); //params to get project id
  const { getProjectfromList, projects, setProjects } =
    useContext(ProjectContext);
  //   console.log(params);

  const [projectName, setProjectName] = useState("");
  const [projectDesc, setProjectDesc] = useState("");
  const [projectOwnerEmail, setProjectOwnerEmail] = useState("");
  const navigate = useNavigate();

  const [showAlert, setShowAlert] = useState(false);

  async function getprojectdetails() {
    const project = await getProjectfromList(params.project_id);
    if (!project){
      navigate("/");
    } 
    else{
    // console.log(project);
    setProjectName(project.Project_Name); //set values
    setProjectDesc(project.Project_Description);
    setEditedDesc(project.Project_Description);
    setProjectOwnerEmail(project.Project_Owner_Email);
    }
  }
  async function viewteam() {
    //view team button navigation
    navigate(`/projects/${params.project_id}/member`, {
      state: { projectData: projectOwnerEmail },
    });
  }

  const [isEditing, setIsEditing] = useState(false); //find if desc is editing or not
  const [editedDesc, setEditedDesc] = useState(""); //initially editedDesc= current projectDesc

  const handleEditClick = async() => {
    //if click on edit icon
    const { username, userId, signInDetails } =await currentAuthenticatedUser();
    if (projectOwnerEmail === signInDetails.loginId) {
      setIsEditing(true);    
    } else {
        setShowAlert(true);
    }
    
  };

  const handleSaveClick = async () => {
    //if click on save button, update desc in backend and frontend
    try {
      const project_id = params.project_id;
      const updatedProject = await updateproject(project_id, editedDesc); //api call to update project desc
      // const response = await getproject(project_id); //get call api from database
      //save in context
      const project = projects.find(
        (project) => project.Project_Id === project_id
      );
      project.Project_Description = editedDesc;
      setProjects([...projects]);

      setIsEditing(false);
      setProjectDesc(editedDesc);
    } catch (e) {
      console.log("Error updating project:", e);
    }
  };

  const handleCancelClick = () => {
    //if click on cancel button, discard changes
    setEditedDesc(projectDesc); //set desc to default
    setIsEditing(false);
  };

  const handleDescriptionChange = (e) => {
    setEditedDesc(e.target.value); //set changed value of textarea in editedDesc
  };

  useEffect(() => {
    getprojectdetails();
  }, [params.project_id]);

  return (
    <div className="project-card">
       <Alert show={showNotFoundAlert} className="project-alert" variant="info" onClose={() => setShowNotFoundAlert(false)} dismissible>
              <p>
              No project found
              </p>
            </Alert>
      <Card className="card-component-top">
        <Card.Body className="overview-card">
          <div className="title">{projectName}</div>
        </Card.Body>
        <ButtonGroup className="btn-container">
          <Link
            className="btn-links"
            to={`/projects/${params.project_id}/overview`} //navigate to /overview
          >
            <Button className="Buttongrp">
              <img className="icons" src={Fileicon} alt="File icon" />
              <div>Overview</div>
            </Button>
          </Link>
          <Link
            className="btn-links"
            to={`/projects/${params.project_id}/tasks`} //navigate to /tasks
          >
            <Button className="Buttongrp">
              <img className="icons" src={Listicon} alt="List icon" />
              Tasks
            </Button>
          </Link>
          {/* <Link
            className="btn-links"
            to={`/projects/${params.project_id}/files`} //navigate to /files
          >
            <Button className="Buttongrp">
              <img className="icons" src={File2icon} alt="File icon" />
              Files
            </Button>
          </Link> */}
        </ButtonGroup>
      </Card>
      {params.viewname === "overview" && (
        <Card className="card-component-bottom">
          <Card.Body className="project-desc">
            Project Description
            <img
              title="Edit Description"
              className="edit-icon"
              src={editicon}
              onClick={() => {
                handleEditClick();
              }}
            ></img>
            <span
              className="delete-icon"
              onClick={async () => {
                const { username, userId, signInDetails } =
                  await currentAuthenticatedUser();
                if (projectOwnerEmail === signInDetails.loginId) {
                  ShowDeleteModal(); //show modal
                } else {
                  setShowAlert(true);
                }
              }}
            >
              <img
                className="delete-img"
                title="Delete Project"
                src={deleteicon}
              ></img>
              Delete Project
            </span>
            <DeleteProjectModal
              show={modalShow}
              handleClose={CloseDeleteModal}
              project_id={params.project_id}
            />
            <Alert show={showAlert} className="project-alert" variant="info" onClose={() => setShowAlert(false)} dismissible>
              <p>
              You are not authorized, Only Project Owner can perform this operation.
              </p>
            </Alert>
            <div>
              {isEditing ? ( //if isediting true=> text area to update desc
                <textarea
                  className="text-area"
                  value={editedDesc}
                  onChange={handleDescriptionChange}
                  rows={4}
                />
              ) : (
                //else div to display project desc
                <div className="desc-border">
                  <p>{projectDesc}</p>
                </div>
              )}
            </div>
            {isEditing ? ( //if is editing true display 2 buttons cancel and save
              <>
                <Button className="project-edit-btn" onClick={handleSaveClick}>
                  Save
                </Button>
                <Button
                  className="project-edit-btn"
                  onClick={handleCancelClick}
                >
                  Cancel
                </Button>
              </>
            ) : (
              <></>
            )}
            <div className="project-buttons">
              <Button
                className="view-team-btn"
                onClick={() => {
                  viewteam();
                }}
              >
                View Team
              </Button>
            </div>
          </Card.Body>
        </Card>
      )}
      {params.viewname === "tasks" && <DisplayTasks />}
    </div>
  );
}

export default ProjectOverview;
