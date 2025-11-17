'use client'

import { useState, useRef } from 'react'
import { useCreateContact } from '@/lib/hooks/use-create-contact'
import { useQueryClient } from '@tanstack/react-query'
import { Contact } from '@/types/frontend'
import { Button } from './ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { AlertCircle, CheckCircle2, Upload, FileText } from 'lucide-react'
import { API_ENDPOINTS } from '@/lib/api/endpoints'

interface AddContactDialogProps {
  onAddContact?: (contact: Contact) => void
}

export function AddContactDialog({ onAddContact }: AddContactDialogProps) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [relationship, setRelationship] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [showSuccess, setShowSuccess] = useState(false)
  const [importError, setImportError] = useState<string | null>(null)
  const [importSuccess, setImportSuccess] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [importCount, setImportCount] = useState<number | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const createContact = useCreateContact()
  const queryClient = useQueryClient()

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

  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.name.endsWith('.vcf') && !file.type.includes('vcard')) {
      setImportError('Please upload a .vcf file (vCard format)')
      return
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      setImportError('File size exceeds 10MB limit')
      return
    }

    setImportError(null)
    setImportSuccess(false)
    setIsImporting(true)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch(API_ENDPOINTS.contactsImport, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to import contacts')
      }

      const result = await response.json()
      setImportSuccess(true)
      setImportCount(result.imported || result.total || null)

      // Refresh relationships list
      queryClient.invalidateQueries({ queryKey: ['relationships'] })

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }

      // Close dialog after a short delay
      setTimeout(() => {
        setOpen(false)
        setImportSuccess(false)
        setImportCount(null)
      }, 2000)
    } catch (err: any) {
      setImportError(err.message || 'Failed to import contacts')
    } finally {
      setIsImporting(false)
    }
  }

  const handleReset = () => {
    setName('')
    setRelationship('')
    setError(null)
    setShowSuccess(false)
    setImportError(null)
    setImportSuccess(false)
    setImportCount(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
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
        <Tabs defaultValue="manual" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="manual">Add Manually</TabsTrigger>
            <TabsTrigger value="import">Import from iOS/Google</TabsTrigger>
          </TabsList>
          
          <TabsContent value="manual" className="space-y-4">
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
                    handleReset()
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
          </TabsContent>

          <TabsContent value="import" className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="vcf-file" className="text-base">Upload vCard File (.vcf)</Label>
                <p className="text-sm text-slate-600">
                  Export your contacts from iOS Contacts or Google Contacts as a .vcf file and upload it here.
                </p>
                <div className="flex items-center gap-4">
                  <input
                    ref={fileInputRef}
                    type="file"
                    id="vcf-file"
                    accept=".vcf,.vcard"
                    onChange={handleFileImport}
                    className="hidden"
                    disabled={isImporting}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isImporting}
                    className="flex items-center gap-2"
                  >
                    <Upload className="w-4 h-4" />
                    {isImporting ? 'Importing...' : 'Choose File'}
                  </Button>
                  {fileInputRef.current?.files?.[0] && (
                    <span className="text-sm text-slate-600 flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      {fileInputRef.current.files[0].name}
                    </span>
                  )}
                </div>
              </div>

              {/* Import Error Message */}
              {importError && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  <span>{importError}</span>
                </div>
              )}

              {/* Import Success Message */}
              {importSuccess && (
                <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>
                    {importCount !== null 
                      ? `Successfully imported ${importCount} contact${importCount !== 1 ? 's' : ''}!`
                      : 'Contacts imported successfully!'
                    }
                  </span>
                </div>
              )}

              <div className="flex gap-2 justify-end">
                <Button 
                  type="button" 
                  variant="ghost" 
                  onClick={() => {
                    setOpen(false)
                    handleReset()
                  }}
                  disabled={isImporting}
                >
                  Close
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
