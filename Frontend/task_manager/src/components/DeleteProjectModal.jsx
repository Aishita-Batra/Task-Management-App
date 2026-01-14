import Button from "react-bootstrap/Button";
import Modal from "react-bootstrap/Modal";
import { ProjectContext } from "../controllers/ProjectContext";
import { useNavigate } from "react-router-dom";
import { deleteproject } from "../controllers/projectops";
import { useContext, useState } from "react";
import { Alert } from "react-bootstrap";

const DeleteProjectModal = ({ show, handleClose, project_id }) => {
  const { removeProjectfromList } = useContext(ProjectContext);
  const navigate = useNavigate();

  const DeleteProjectAndClose = async () => {
    const res = await deleteproject(project_id); //delete api call
    console.log(res);
    removeProjectfromList(project_id); //delete project from context
    navigate("/"); //navigate to home page
  };

  return (
    
    <Modal show={show} onHide={handleClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>Delete Project</Modal.Title>
      </Modal.Header>
      <Modal.Body>Are you sure you want to delete this project?</Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={DeleteProjectAndClose}>
          Yes
        </Button>
        <Button variant="primary" onClick={handleClose}>
          No
        </Button>
      </Modal.Footer>
    </Modal>
  );
};
export default DeleteProjectModal;
