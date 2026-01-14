import React from 'react';
import { render, fireEvent, waitFor, screen } from '@testing-library/react';
import AddMemberModal from './AddMemberModal';
import { addTeamMember } from '../controllers/memberops';
import '@testing-library/jest-dom';
import { useParams } from 'react-router-dom';
jest.mock('react-router-dom', () => ({
  useParams: jest.fn().mockReturnValue({ project_id: 'project123' }), // Mock useParams hook
}));
jest.mock('../controllers/memberops', () => ({
  addTeamMember: jest.fn().mockResolvedValue({ statusCode: 200, body: { message: 'Member added successfully' } }),
}));
describe('AddMemberModal component', () => {
  it('calls addTeamMember and closes modal on successful addition', async () => {
    const handleClose = jest.fn();
    const onAddition = jest.fn();
    const handleShowToast = jest.fn();
    render(
      <AddMemberModal show={true} handleClose={handleClose} onAddition={onAddition} handleShowToast={handleShowToast} />
    );
    fireEvent.change(screen.getByLabelText('Email address'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'John Doe' } });
    fireEvent.click(screen.getByText('Add Member'));
    await waitFor(() => expect(addTeamMember).toHaveBeenCalled());
    expect(addTeamMember).toHaveBeenCalledWith('project123', { name: 'John Doe', email: 'test@example.com' });
    expect(onAddition).toHaveBeenCalledWith({ name: 'John Doe', email: 'test@example.com' });
    expect(handleClose).toHaveBeenCalled();
    expect(handleShowToast).toHaveBeenCalledWith({ statusCode: 200, body: { message: 'Member added successfully' } });
  });
//   it('handles error when addTeamMember fails', async () => {
//     const handleClose = jest.fn();
//     const onAddition = jest.fn();
//     const handleShowToast = jest.fn();
//     addTeamMember.mockRejectedValueOnce({statusCode:400,body:{message:"failed to add member"}});
//     render(
//       <AddMemberModal show={true} handleClose={handleClose} onAddition={onAddition} handleShowToast={handleShowToast} />
//     );
//     fireEvent.change(screen.getByLabelText('Email address'), { target: { value: 'test@example.com' } });
//     fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'John Doe' } });
//     fireEvent.click(screen.getByText('Add Member'));
//     await waitFor(() => {
//       expect(handleShowToast).toHaveBeenCalledWith(expect.any(Error));
//     });
//     expect(handleClose).toHaveBeenCalled();
//   });
});


