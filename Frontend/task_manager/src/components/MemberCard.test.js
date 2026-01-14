
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import '@testing-library/jest-dom';
import MemberCard from "./MemberCard";
import ConfirmDeleteModal from "./ConfirmDeleteModal";
import { currentAuthenticatedUser } from "../controllers/config";
jest.mock("../controllers/config", () => ({
  currentAuthenticatedUser: jest.fn(),
}));
jest.mock("./ConfirmDeleteModal", () => {
  return ({ show, handleClose, onRemove, member, projectOwnerEmail, handleShowAlert }) => (
    show && (
      <div>
        <button onClick={onRemove}>Confirm Delete</button>
        <button onClick={handleClose}>Cancel</button>
      </div>
    )
  );
});
const mockCurrentAuthenticatedUser = currentAuthenticatedUser;
const mockHandleShowAlert = jest.fn();
const mockHandleOwnerShowAlert = jest.fn();
const mockOnRemove = jest.fn();
const renderComponent = (props) => {
  return render(<MemberCard {...props} />);
};
describe("MemberCard Component", () => {
  const baseProps = {
    member: { name: "John Doe", email: "john.doe@example.com" },
    onRemove: mockOnRemove,
    projectOwnerEmail: "owner@example.com",
    handleShowAlert: mockHandleShowAlert,
    handleOwnerShowAlert: mockHandleOwnerShowAlert
  };
  beforeEach(() => {
    jest.clearAllMocks();
  });
  it("should display the member's name and email", () => {
    renderComponent(baseProps);
    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(screen.getByText("john.doe@example.com")).toBeInTheDocument();
  });
  it("should call handleOwnerShowAlert if authenticated user is not the project owner", async () => {
    mockCurrentAuthenticatedUser.mockResolvedValue({
      username: "user",
      userId: "123",
      signInDetails: { loginId: "not.owner@example.com" }
    });
    renderComponent(baseProps);
    fireEvent.click(screen.getByText("Remove"));
    await screen.findByText("Remove");
    expect(mockHandleOwnerShowAlert).toHaveBeenCalled();
  });
  it("should show ConfirmDeleteModal if authenticated user is the project owner", async () => {
    mockCurrentAuthenticatedUser.mockResolvedValue({
      username: "user",
      userId: "123",
      signInDetails: { loginId: "owner@example.com" }
    });
    renderComponent(baseProps);
    fireEvent.click(screen.getByText("Remove"));
    await screen.findByText("Remove");
    expect(screen.getByText("Confirm Delete")).toBeInTheDocument();
  });
  it("should call handleCloseConfirmDeleteModal when ConfirmDeleteModal cancel is clicked", async () => {
    mockCurrentAuthenticatedUser.mockResolvedValue({
      username: "user",
      userId: "123",
      signInDetails: { loginId: "owner@example.com" }
    });
    renderComponent(baseProps);
    fireEvent.click(screen.getByText("Remove"));
    await screen.findByText("Cancel");
    fireEvent.click(screen.getByText("Cancel"));
    expect(screen.queryByText("Confirm Delete")).not.toBeInTheDocument();
  });
});


