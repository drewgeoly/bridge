'use client'

import { useState } from 'react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Users, UserPlus, X } from 'lucide-react'
import { useRelationships } from '@/lib/hooks/use-relationships'

interface Person {
  id?: string
  name: string
  email?: string
}

interface PeopleSelectorProps {
  people: Person[]
  onPeopleChange: (people: Person[]) => void
  disabled?: boolean
}

export function PeopleSelector({ people, onPeopleChange, disabled }: PeopleSelectorProps) {
  const [isAdding, setIsAdding] = useState(false)
  const { data: relationshipsData } = useRelationships({ limit: 100 })
  
  const contacts = (relationshipsData?.relationships || []).map((rel) => ({
    id: rel.person_id,
    name: rel.person?.name || 'Unknown',
    email: rel.person?.email,
  }))

  const handleRemovePerson = (index: number) => {
    const newPeople = people.filter((_, i) => i !== index)
    onPeopleChange(newPeople)
  }

  const handleAddPerson = (contact: { id: string; name: string; email?: string }) => {
    // Check if person already added
    if (people.some(p => p.id === contact.id || p.email === contact.email)) {
      return
    }
    
    const newPeople = [...people, { id: contact.id, name: contact.name, email: contact.email }]
    onPeopleChange(newPeople)
    setIsAdding(false)
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-slate-600" />
          <span className="text-sm font-medium text-slate-800">People</span>
        </div>
        {!disabled && !isAdding && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsAdding(true)}
            className="h-7 text-xs"
          >
            <UserPlus className="w-3.5 h-3.5 mr-1" />
            Add
          </Button>
        )}
      </div>

      {/* People List */}
      {people.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {people.map((person, index) => (
            <div
              key={index}
              className="flex items-center gap-2 bg-slate-100 rounded-full px-3 py-1.5 text-sm"
            >
              <Avatar className="w-6 h-6">
                <AvatarFallback className="text-xs bg-sky-100 text-sky-700">
                  {getInitials(person.name)}
                </AvatarFallback>
              </Avatar>
              <span className="text-slate-700">{person.name}</span>
              {!disabled && (
                <button
                  onClick={() => handleRemovePerson(index)}
                  className="ml-1 hover:bg-slate-200 rounded-full p-0.5 transition-colors"
                >
                  <X className="w-3.5 h-3.5 text-slate-500" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add Person Dropdown */}
      {isAdding && !disabled && (
        <div className="border border-slate-200 rounded-lg p-2 bg-white max-h-48 overflow-y-auto">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-600">Select contact</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsAdding(false)}
              className="h-6 w-6 p-0"
            >
              <X className="w-3.5 h-3.5" />
            </Button>
          </div>
          <div className="space-y-1">
            {contacts.length === 0 ? (
              <div className="text-xs text-slate-500 py-2 text-center">
                No contacts available
              </div>
            ) : (
              contacts
                .filter(contact => !people.some(p => p.id === contact.id || p.email === contact.email))
                .map((contact) => (
                  <button
                    key={contact.id}
                    onClick={() => handleAddPerson(contact)}
                    className="w-full flex items-center gap-2 p-2 hover:bg-slate-50 rounded text-left transition-colors"
                  >
                    <Avatar className="w-7 h-7">
                      <AvatarFallback className="text-xs bg-sky-100 text-sky-700">
                        {getInitials(contact.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-slate-800 truncate">{contact.name}</div>
                      {contact.email && (
                        <div className="text-xs text-slate-500 truncate">{contact.email}</div>
                      )}
                    </div>
                  </button>
                ))
            )}
          </div>
        </div>
      )}

      {people.length === 0 && !isAdding && (
        <div className="text-sm text-slate-500 py-2">
          No people added yet
        </div>
      )}
    </div>
  )
}

