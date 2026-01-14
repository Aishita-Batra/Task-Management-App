import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import '@testing-library/jest-dom';
import MyNavBar from "./MyNavbar";
jest.mock("../controllers/config.jsx", () => ({
  currentSession: jest.fn(),
}));
const mockCurrentSession = require("../controllers/config.jsx").currentSession;
const mockSignOut = jest.fn();
describe("MyNavBar Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  it("should render the navbar with app name and logout button", async () => {
    mockCurrentSession.mockResolvedValue({ uname: "John Doe" });
    render(<MyNavBar signOut={mockSignOut} />);
    expect(screen.getByText("TASK MANAGER")).toBeInTheDocument();
    expect(screen.getByText("LOGOUT")).toBeInTheDocument();
  });
  it("should display user name fetched from current session", async () => {
    mockCurrentSession.mockResolvedValue({ uname: "John Doe" });
    render(<MyNavBar signOut={mockSignOut} />);
    expect(await screen.findByText("John Doe")).toBeInTheDocument();
  });
  it("should call signOut function when logout button is clicked", async () => {
    mockCurrentSession.mockResolvedValue({ uname: "John Doe" });
    render(<MyNavBar signOut={mockSignOut} />);
    fireEvent.click(screen.getByText("LOGOUT"));
    expect(mockSignOut).toHaveBeenCalled();
  });
});









