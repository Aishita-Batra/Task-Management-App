import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import Modal from "react-bootstrap/Modal";
import { useState } from "react";
import { addTeamMember } from "../controllers/memberops";
import { useParams } from "react-router-dom";
import { Toast } from "react-bootstrap";

const AddMemberModal = ({ show, handleClose, onAddition, handleShowToast }) => {
  const { project_id } = useParams();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  //function to add new member to the team and show toast with response message
  async function onAdditionAndClose() {
    const newMember = { name, email };
    console.log(newMember);

    try {
      const response = await addTeamMember(project_id, newMember);
      console.log(response.body);

      if (response.statusCode === 200) {
        onAddition(newMember);
      }
      handleShowToast(response);
    } catch (error) {
      // Handle error case
      console.error("Error occurred while adding team member:", error);
    }

    setEmail(""); // Reset email state
    setName(""); // Reset name state
    handleClose();
  }

  return (
    <>
      <Modal show={show} onHide={handleClose}>
        <Modal.Header closeButton>
          <Modal.Title>Add new member to the team</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3" controlId="exampleForm.ControlInput1">
              <Form.Label>Email address</Form.Label>
              <Form.Control
                type="email"
                placeholder="name@example.com"
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </Form.Group>
            <Form.Group className="mb-3" controlId="exampleForm.ControlInput2">
              <Form.Label>Name</Form.Label>
              <Form.Control
                type="text"
                placeholder="Team Member Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose}>
            Close
          </Button>
          <Button variant="primary" onClick={onAdditionAndClose}>
            Add Member
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default AddMemberModal;
