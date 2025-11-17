import { useState } from 'react';
import { Contact } from '../App';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';

interface AddContactDialogProps {
  onAddContact: (contact: Contact) => void;
}

export function AddContactDialog({ onAddContact }: AddContactDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [relationship, setRelationship] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newContact: Contact = {
      id: Date.now().toString(),
      name: name.trim(),
      relationship: relationship.trim() || undefined,
    };

    onAddContact(newContact);
    setName('');
    setRelationship('');
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="text-slate-700 hover:text-slate-900 transition-colors text-left w-full">
          Add a new contact
        </button>
      </DialogTrigger>
      <DialogContent className="bg-white/95 backdrop-blur-md border-white/50">
        <DialogHeader>
          <DialogTitle>Add a New Contact</DialogTitle>
          <DialogDescription>
            Add someone you'd like to stay connected with
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter name"
              className="bg-white"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="relationship">Relationship (optional)</Label>
            <Input
              id="relationship"
              value={relationship}
              onChange={(e) => setRelationship(e.target.value)}
              placeholder="e.g., Friend, Colleague, Family"
              className="bg-white"
            />
          </div>
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!name.trim()} className="bg-slate-700 hover:bg-slate-800">
              Add Contact
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}