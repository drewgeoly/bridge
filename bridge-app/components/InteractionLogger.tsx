'use client'

import { useState, useEffect, useMemo } from "react"
import { useRelationships } from "@/lib/hooks/use-relationships"
import { useLogConnection } from "@/lib/hooks/use-log-connection"
import { useRouter } from "next/navigation"
import { Button } from "./ui/button"
import { Card, CardContent } from "./ui/card"
import { Label } from "./ui/label"
import { Input } from "./ui/input"
import { Textarea } from "./ui/textarea"
import { Calendar } from "./ui/calendar"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "./ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "./ui/popover"
import { Settings, Check, ChevronsUpDown, CalendarIcon, Plus, CheckCircle2, AlertCircle } from "lucide-react"
import { format } from "date-fns"
import { cn } from "./ui/utils"
import type { Contact } from "@/types/frontend"

interface InteractionLoggerProps {
  onBack?: () => void
  onNavigate?: (page: "home" | "logger" | "advice" | "settings") => void
}

export function InteractionLogger({
  onBack,
  onNavigate,
}: InteractionLoggerProps) {
  const router = useRouter()
  const [selectedContact, setSelectedContact] = useState('')
  const [open, setOpen] = useState(false)
  const [dateOpen, setDateOpen] = useState(false)
  const [method, setMethod] = useState('')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState<Date>(new Date())
  const [searchQuery, setSearchQuery] = useState('')
  const [showSuccess, setShowSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch relationships for contact list
  const { data: relationshipsData, isLoading: contactsLoading } = useRelationships({ limit: 100 })
  
  // Transform relationships to contacts
  const contacts: Contact[] = useMemo(() => {
    if (!relationshipsData?.relationships) return []
    
    return relationshipsData.relationships.map((rel) => ({
      id: rel.person_id,
      name: rel.person?.name || 'Unknown',
      relationship: rel.metadata?.relationship as string | undefined,
    }))
  }, [relationshipsData])

  // Filter contacts based on search query
  const filteredContacts = useMemo(() => {
    if (!searchQuery) return contacts
    const query = searchQuery.toLowerCase()
    return contacts.filter(contact => 
      contact.name.toLowerCase().includes(query) ||
      contact.relationship?.toLowerCase().includes(query)
    )
  }, [contacts, searchQuery])

  // Log connection mutation
  const logConnection = useLogConnection()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    
    const contact = contacts.find(c => c.id === selectedContact)
    if (!contact || !method) {
      setError('Please select a contact and method')
      return
    }

    try {
      await logConnection.mutateAsync({
        name: contact.name,
        method,
        description: description || undefined,
        occurredAt: date,
      })
      
      // Show success message
      setShowSuccess(true)
      
      // Reset form
      setSelectedContact('')
      setOpen(false)
      setSearchQuery('')
      setMethod('')
      setDescription('')
      setDate(new Date())
      
      // Hide success message after 2 seconds
      setTimeout(() => setShowSuccess(false), 2000)
    } catch (err: any) {
      setError(err.message || 'Failed to log connection')
    }
  }

  const handleBack = () => {
    if (onBack) {
      onBack()
    } else {
      router.push('/')
    }
  }

  const handleNavigate = (page: "home" | "logger" | "advice" | "settings") => {
    if (onNavigate) {
      onNavigate(page)
    } else {
      router.push(`/${page === 'home' ? '' : page}`)
    }
  }

  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="border-b border-white/30 bg-white/20 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <button 
              onClick={handleBack}
              className="text-3xl text-slate-800 hover:text-slate-900 transition-colors"
              style={{
                fontFamily: "Georgia, serif",
                fontStyle: "italic",
              }}
            >
              bridge
            </button>
            <div className="flex gap-6">
              <button className="text-slate-700 hover:text-slate-900 transition-colors">
                Log Connection
              </button>
              <button 
                onClick={() => handleNavigate("advice")}
                className="text-slate-600 hover:text-slate-800 transition-colors"
              >
                Get Advice
              </button>
            </div>
          </div>
          <button
            onClick={() => handleNavigate("settings")}
            className="w-10 h-10 rounded-full bg-white/40 backdrop-blur-sm flex items-center justify-center hover:bg-white/60 transition-all border border-white/50"
          >
            <Settings className="w-5 h-5 text-slate-700" />
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-8 py-12">
        <div className="mb-12">
          <h2 className="text-6xl text-slate-800 mb-4" style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
            Log a Connection
          </h2>
          <p className="text-xl text-slate-600">Record a meaningful interaction</p>
        </div>

        <Card className="bg-white/40 backdrop-blur-md border-white/50 shadow-lg">
          <CardContent className="p-12">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Date */}
              <div className="space-y-3">
                <Label htmlFor="date" className="text-slate-700">Date *</Label>
                <Popover open={dateOpen} onOpenChange={setDateOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      type="button"
                      className={cn(
                        "w-full justify-start bg-white/80 backdrop-blur-sm border-white/50 h-12 text-left hover:bg-white/90",
                        !date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-white" align="start">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={(selectedDate: Date | undefined) => {
                        if (selectedDate) {
                          setDate(selectedDate)
                          setDateOpen(false)
                        }
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Who */}
              <div className="space-y-3">
                <Label htmlFor="contact" className="text-slate-700">Who did you connect with? *</Label>
                <Popover open={open} onOpenChange={setOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      type="button"
                      role="combobox"
                      aria-expanded={open}
                      className="w-full justify-between bg-white/80 backdrop-blur-sm border-white/50 h-12 text-slate-700 hover:bg-white/90"
                      disabled={contactsLoading}
                    >
                      {selectedContact
                        ? contacts.find((contact) => contact.id === selectedContact)?.name || "Select contact..."
                        : "Search for a contact..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                    <Command>
                      <CommandInput 
                        placeholder="Search contacts..." 
                        className="h-9"
                        value={searchQuery}
                        onValueChange={setSearchQuery}
                      />
                      <CommandList>
                        <CommandEmpty>
                          {contactsLoading ? "Loading contacts..." : "No contacts found."}
                        </CommandEmpty>
                        <CommandGroup>
                          {filteredContacts.map((contact) => (
                            <CommandItem
                              key={contact.id}
                              value={contact.name}
                              onSelect={() => {
                                setSelectedContact(contact.id)
                                setSearchQuery('')
                                setOpen(false)
                              }}
                            >
                              {contact.name}
                              {contact.relationship && (
                                <span className="text-slate-500 ml-2">• {contact.relationship}</span>
                              )}
                              <Check
                                className={cn(
                                  "ml-auto h-4 w-4",
                                  selectedContact === contact.id ? "opacity-100" : "opacity-0"
                                )}
                              />
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              {/* Method */}
              <div className="space-y-3">
                <Label htmlFor="method" className="text-slate-700">How did you connect? *</Label>
                <Select value={method} onValueChange={setMethod}>
                  <SelectTrigger id="method" className="bg-white/80 backdrop-blur-sm border-white/50 h-12">
                    <SelectValue placeholder="Select method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Coffee">Coffee</SelectItem>
                    <SelectItem value="Lunch">Lunch</SelectItem>
                    <SelectItem value="Dinner">Dinner</SelectItem>
                    <SelectItem value="Phone call">Phone call</SelectItem>
                    <SelectItem value="Video call">Video call</SelectItem>
                    <SelectItem value="Text message">Text message</SelectItem>
                    <SelectItem value="Walk">Walk</SelectItem>
                    <SelectItem value="Activity">Activity</SelectItem>
                    <SelectItem value="Event">Event</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Description */}
              <div className="space-y-3">
                <Label htmlFor="description" className="text-slate-700">Description (optional)</Label>
                <Textarea
                  id="description"
                  placeholder="What did you talk about? How did it go?"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="bg-white/80 backdrop-blur-sm min-h-[120px] resize-none border-white/50"
                />
              </div>

              {/* Success Message */}
              {showSuccess && (
                <div className="flex items-center gap-2 p-4 bg-white/60 backdrop-blur-sm border border-white/50 rounded-lg text-slate-700">
                  <CheckCircle2 className="w-5 h-5" />
                  <span>Connection logged successfully!</span>
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="flex items-center gap-2 p-4 bg-red-50 backdrop-blur-sm border border-red-200 rounded-lg text-red-700">
                  <AlertCircle className="w-5 h-5" />
                  <span>{error}</span>
                </div>
              )}

              {/* Submit */}
              <div className="flex items-center gap-4 pt-4">
                <Button 
                  type="submit" 
                  className="h-10 px-5 bg-white/60 hover:bg-white/80 text-slate-700 hover:text-slate-800 border border-white/50 backdrop-blur-sm transition-all rounded-full"
                  disabled={!selectedContact || !method || !date || logConnection.isPending}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  {logConnection.isPending ? 'Saving...' : 'Save'}
                </Button>
                <Button 
                  type="button"
                  variant="ghost"
                  onClick={handleBack}
                  className="h-10 px-5 text-slate-500 hover:text-slate-700"
                  disabled={logConnection.isPending}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
