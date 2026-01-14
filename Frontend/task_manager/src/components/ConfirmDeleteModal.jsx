import Button from "react-bootstrap/Button";
import Modal from "react-bootstrap/Modal";
import { removeTeamMember } from "../controllers/memberops";
import { useParams } from "react-router-dom";

function ConfirmDeleteModal({
  member,
  show,
  handleClose,
  onRemove,
  projectOwnerEmail,
  handleShowAlert,
}) {
  const { project_id } = useParams();
  //if the member to be removed is project owner show alert else remove member after confirming and close modal
  const handleRemoveMemberAndClose = () => {
    if (member.email === projectOwnerEmail) {
      handleShowAlert();
      handleClose();
      return;
    }
    onRemove(member.email);
    removeTeamMember(project_id, member.email);
    handleClose();
  };
  return (
    <>
      <Modal show={show} onHide={handleClose}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Deletion</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure that you want to remove {member.name} from the team?
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleRemoveMemberAndClose}>
            Yes, Remove
          </Button>
          <Button variant="primary" onClick={handleClose}>
            No
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}

export default ConfirmDeleteModal;
