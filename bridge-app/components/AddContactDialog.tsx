'use client'

import { useState, useRef, useCallback } from 'react'
import { useCreateContact } from '@/lib/hooks/use-create-contact'
import { useQueryClient } from '@tanstack/react-query'
import { Contact } from '@/types/frontend'
import { Button } from './ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { AlertCircle, CheckCircle2, Upload, FileText, UserPlus, Loader2 } from 'lucide-react'
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
  const [isDragging, setIsDragging] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
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

  const validateAndImportFile = async (file: File) => {
    // Validate file type
    if (!file.name.endsWith('.vcf') && !file.type.includes('vcard')) {
      setImportError('Please upload a .vcf file (vCard format)')
      return false
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      setImportError('File size exceeds 10MB limit')
      return false
    }

    setImportError(null)
    setImportSuccess(false)
    setIsImporting(true)
    setSelectedFile(file)

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

      // Close dialog after a short delay
      setTimeout(() => {
        setOpen(false)
        setImportSuccess(false)
        setImportCount(null)
        setSelectedFile(null)
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
      }, 2000)
      
      return true
    } catch (err: any) {
      setImportError(err.message || 'Failed to import contacts')
      return false
    } finally {
      setIsImporting(false)
    }
  }

  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    await validateAndImportFile(file)
  }

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const file = e.dataTransfer.files?.[0]
    if (file) {
      await validateAndImportFile(file)
    }
  }, [])

  const handleReset = () => {
    setName('')
    setRelationship('')
    setError(null)
    setShowSuccess(false)
    setImportError(null)
    setImportSuccess(false)
    setImportCount(null)
    setSelectedFile(null)
    setIsDragging(false)
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
      <DialogContent className="bg-white/95 backdrop-blur-md border-white/50 max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl">Add a New Contact</DialogTitle>
          <DialogDescription>
            Add someone you'd like to stay connected with
          </DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="manual" className="w-full mt-2">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="manual" className="flex items-center gap-2">
              <UserPlus className="w-4 h-4" />
              Add Manually
            </TabsTrigger>
            <TabsTrigger value="import" className="flex items-center gap-2">
              <Upload className="w-4 h-4" />
              Import File
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="manual" className="space-y-5 mt-4">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium">Name *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter full name"
                  className="bg-white h-10"
                  disabled={createContact.isPending}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="relationship" className="text-sm font-medium">Relationship</Label>
                <Input
                  id="relationship"
                  value={relationship}
                  onChange={(e) => setRelationship(e.target.value)}
                  placeholder="e.g., Friend, Colleague, Family"
                  className="bg-white h-10"
                  disabled={createContact.isPending}
                />
                <p className="text-xs text-slate-500 mt-1">Optional - helps us provide better suggestions</p>
              </div>

              {/* Error Message */}
              {error && (
                <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm animate-in fade-in">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Success Message */}
              {showSuccess && (
                <div className="flex items-start gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>Contact added successfully!</span>
                </div>
              )}

              <div className="flex gap-3 justify-end pt-2">
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
                  className="bg-slate-700 hover:bg-slate-800 min-w-[120px]"
                >
                  {createContact.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4 mr-2" />
                      Add Contact
                    </>
                  )}
                </Button>
              </div>
            </form>
          </TabsContent>

          <TabsContent value="import" className="space-y-4 mt-4">
            <div className="space-y-4">
              <div className="space-y-3">
                <div>
                  <Label className="text-sm font-medium">Upload vCard File (.vcf)</Label>
                  <p className="text-xs text-slate-600 mt-1">
                    Export your contacts from iOS Contacts or Google Contacts as a .vcf file
                  </p>
                </div>
                
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                    isDragging
                      ? 'border-sky-500 bg-sky-50'
                      : 'border-slate-300 bg-slate-50/50 hover:border-slate-400 hover:bg-slate-50'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    id="vcf-file"
                    accept=".vcf,.vcard"
                    onChange={handleFileImport}
                    className="hidden"
                    disabled={isImporting}
                  />
                  
                  {isImporting ? (
                    <div className="space-y-3">
                      <Loader2 className="w-8 h-8 mx-auto animate-spin text-sky-600" />
                      <p className="text-sm text-slate-700">Importing contacts...</p>
                      {selectedFile && (
                        <p className="text-xs text-slate-500">{selectedFile.name}</p>
                      )}
                    </div>
                  ) : (
                    <>
                      <Upload className={`w-10 h-10 mx-auto mb-3 ${isDragging ? 'text-sky-600' : 'text-slate-400'}`} />
                      <p className="text-sm text-slate-700 mb-2">
                        {isDragging ? 'Drop your .vcf file here' : 'Drag and drop your .vcf file here'}
                      </p>
                      <p className="text-xs text-slate-500 mb-4">or</p>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isImporting}
                        className="flex items-center gap-2 mx-auto"
                      >
                        <FileText className="w-4 h-4" />
                        Choose File
                      </Button>
                      {selectedFile && !isImporting && (
                        <div className="mt-4 p-2 bg-white rounded border border-slate-200">
                          <div className="flex items-center gap-2 text-sm text-slate-700">
                            <FileText className="w-4 h-4 text-slate-500" />
                            <span className="truncate">{selectedFile.name}</span>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Import Error Message */}
              {importError && (
                <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm animate-in fade-in">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>{importError}</span>
                </div>
              )}

              {/* Import Success Message */}
              {importSuccess && (
                <div className="flex items-start gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>
                    {importCount !== null 
                      ? `Successfully imported ${importCount} contact${importCount !== 1 ? 's' : ''}!`
                      : 'Contacts imported successfully!'
                    }
                  </span>
                </div>
              )}

              <div className="flex gap-2 justify-end pt-2">
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
