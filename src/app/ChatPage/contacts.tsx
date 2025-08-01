import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { LOAD_CONNECTIONS_LIST, REMOVE_CONNECTION } from '@/graphql';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription, DialogClose } from '@/components/ui/dialog';

const ContactsPage: React.FC = () => {
  const navigate = useNavigate();
  const { data, loading, error, refetch } = useQuery(LOAD_CONNECTIONS_LIST, {
    variables: {},
    fetchPolicy: 'cache-and-network',
  });

  const [selectedContact, setSelectedContact] = useState<any>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [pendingRemoveId, setPendingRemoveId] = useState<string | null>(null);

  const [removeConnection, { loading: removing }] = useMutation(REMOVE_CONNECTION, {
    onCompleted: () => {
      // Refetch connections after removal
      if (typeof refetch === 'function') refetch();
    },
  });

  const handleRemoveConnection = async (connectionId: string) => {
    await removeConnection({ variables: { connectionId } });
  };


  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // If on mobile and a contact is selected, navigate to chat and render nothing
  useEffect(() => {
    if (isMobile && selectedContact) {
      navigate(`/chat/${selectedContact.chat_id}`);
    }
  }, [isMobile, selectedContact, navigate]);

  if (loading) return <div>Loading contacts...</div>;
  if (error) return <div>Error loading contacts: {error.message}</div>;

  const connections = data?.loadConnectionsList || [];

  // If on mobile and a contact is selected, navigate to chat and render nothing
  if (isMobile && selectedContact) {
    return null; // or a loading spinner if you prefer
  }

  return (
    <div className="max-w-lg mx-auto p-4">
      <div
        className="flex items-center justify-between p-3 mb-4 rounded cursor-pointer hover:bg-gray-200"
        onClick={() => navigate('/contacts/requests')}
      >
        <span className="font-semibold">See pending requests</span>
        <ChevronRight size={20} />
      </div>
      <ul>
        {connections.length === 0 ? (
          <li className="text-gray-500">No connections found.</li>
        ) : (
          connections.map((conn: any) => (
            <li key={conn._id} className="flex items-center gap-3 p-2 border-b">
              <img src={conn.photo || '/default-avatar.png'} alt="avatar" className="w-10 h-10 rounded-full" />
              <div className="flex-1">
                <div className="font-medium">{conn.first_name} {conn.last_name}</div>
                <div className="text-xs text-gray-500">{conn.status}</div>
              </div>
              <Button
                variant="default"
                size="sm"
                className="ml-2"
                onClick={() => {
                  if (isMobile) {
                    setSelectedContact(conn);
                    navigate(`/chat/${conn.chat_id}`, { state: { firstName: conn.first_name, lastName: conn.last_name, photo: conn.photo } });
                  } else {
                    navigate(`/chat/${conn.chat_id}`, { state: { firstName: conn.first_name, lastName: conn.last_name, photo: conn.photo } });
                  }
                }}
              >
                Chat
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="ml-2"
                onClick={() => { setPendingRemoveId(conn._id); setConfirmDialogOpen(true); }}
                disabled={removing}
              >
               <Minus className="text-red-500" />
              </Button>
            </li>
          ))
        )}
      </ul>
      {/* Confirmation Dialog for Remove Connection */}
      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Connection</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove this connection? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 flex gap-2">
            <DialogClose asChild>
              <Button type="button" variant="ghost" disabled={removing}>
                Cancel
              </Button>
            </DialogClose>
            <Button
              type="button"
              variant="destructive"
              onClick={() => {
                if (pendingRemoveId) handleRemoveConnection(pendingRemoveId);
                setConfirmDialogOpen(false);
                setPendingRemoveId(null);
              }}
              disabled={removing}
            >
              {removing ? 'Removing...' : 'Yes, remove'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ContactsPage; 