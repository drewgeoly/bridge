'use client'

import { useState } from 'react'
import { useCreateContact } from '@/lib/hooks/use-create-contact'
import { Contact } from '@/types/frontend'
import { Button } from './ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { AlertCircle, CheckCircle2 } from 'lucide-react'

interface AddContactDialogProps {
  onAddContact?: (contact: Contact) => void
}

export function AddContactDialog({ onAddContact }: AddContactDialogProps) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [relationship, setRelationship] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [showSuccess, setShowSuccess] = useState(false)

  const createContact = useCreateContact()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    setError(null)
    setShowSuccess(false)

    try {
      const result = await createContact.mutateAsync({
        name: name.trim(),
        relationship: relationship.trim() || undefined,
      })

      // Show success message
      setShowSuccess(true)

      // Call optional callback if provided
      if (onAddContact) {
        onAddContact({
          id: result.person.id,
          name: result.person.name || name.trim(),
          relationship: result.relationship.metadata?.relationship as string | undefined,
        })
      }

      // Reset form
      setName('')
      setRelationship('')
      
      // Close dialog after a short delay
      setTimeout(() => {
        setOpen(false)
        setShowSuccess(false)
      }, 1500)
    } catch (err: any) {
      setError(err.message || 'Failed to create contact')
    }
  }

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
              disabled={createContact.isPending}
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
              disabled={createContact.isPending}
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              <AlertCircle className="w-4 h-4" />
              <span>{error}</span>
            </div>
          )}

          {/* Success Message */}
          {showSuccess && (
            <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
              <CheckCircle2 className="w-4 h-4" />
              <span>Contact added successfully!</span>
            </div>
          )}

          <div className="flex gap-2 justify-end">
            <Button 
              type="button" 
              variant="ghost" 
              onClick={() => {
                setOpen(false)
                setName('')
                setRelationship('')
                setError(null)
                setShowSuccess(false)
              }}
              disabled={createContact.isPending}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={!name.trim() || createContact.isPending} 
              className="bg-slate-700 hover:bg-slate-800"
            >
              {createContact.isPending ? 'Adding...' : 'Add Contact'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
