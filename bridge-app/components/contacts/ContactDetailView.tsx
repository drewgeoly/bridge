'use client'

import { useState } from 'react'
import { useRelationships } from '@/lib/hooks/use-relationships'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ContactInteractionTimeline } from './ContactInteractionTimeline'
import { ContactEditForm } from './ContactEditForm'
import { ArrowLeft, Edit, Mail, Phone, MapPin, Briefcase, Calendar } from 'lucide-react'
import { format } from 'date-fns'

interface ContactDetailViewProps {
  contactId: string
  onBack?: () => void
  onNavigate?: (page: 'home' | 'logger' | 'advice' | 'settings' | 'contacts') => void
}

export function ContactDetailView({ contactId, onBack, onNavigate }: ContactDetailViewProps) {
  const [isEditing, setIsEditing] = useState(false)
  const { data: relationshipsData } = useRelationships({ limit: 1000 })
  
  const relationship = relationshipsData?.relationships.find(
    r => r.person_id === contactId
  )
  
  if (!relationship) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-600 mb-4">Contact not found</p>
          {onBack && (
            <Button onClick={onBack} variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </Button>
          )}
        </div>
      </div>
    )
  }

  const person = relationship.person
  const name = person?.name || 'Unknown'
  const relationshipType = (relationship.metadata?.relationship as string) || undefined
  const email = person?.email
  const phoneNumbers = person?.phone_numbers || []
  const lastInteraction = relationship.last_interaction
    ? new Date(relationship.last_interaction)
    : null

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  if (isEditing) {
    return (
      <ContactEditForm
        relationship={relationship}
        onCancel={() => setIsEditing(false)}
        onSave={() => setIsEditing(false)}
      />
    )
  }

  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="border-b border-white/30 bg-white/20 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="text-slate-600 hover:text-slate-800 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1
              className="text-3xl text-slate-800"
              style={{
                fontFamily: 'Georgia, serif',
                fontStyle: 'italic',
              }}
            >
              bridge
            </h1>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-8 py-12">
        {/* Contact Header */}
        <Card className="bg-white/60 backdrop-blur-sm rounded-3xl p-8 shadow-lg border border-white/50 mb-8">
          <div className="flex items-start gap-6">
            <Avatar className="w-20 h-20 flex-shrink-0">
              <AvatarFallback className="bg-sky-100 text-sky-700 text-2xl">
                {getInitials(name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-3xl text-slate-800 font-semibold mb-2">{name}</h2>
                  {relationshipType && (
                    <div className="text-slate-600 mb-2">{relationshipType}</div>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-2"
                >
                  <Edit className="w-4 h-4" />
                  Edit
                </Button>
              </div>

              {/* Contact Info */}
              <div className="space-y-2">
                {email && (
                  <div className="flex items-center gap-2 text-slate-700">
                    <Mail className="w-4 h-4 text-slate-500" />
                    <span>{email}</span>
                  </div>
                )}
                {phoneNumbers.length > 0 && (
                  <div className="flex items-center gap-2 text-slate-700">
                    <Phone className="w-4 h-4 text-slate-500" />
                    <span>{phoneNumbers.join(', ')}</span>
                  </div>
                )}
                {lastInteraction && (
                  <div className="flex items-center gap-2 text-slate-600 text-sm mt-3">
                    <Calendar className="w-4 h-4 text-slate-500" />
                    <span>Last interaction: {format(lastInteraction, 'MMM d, yyyy')}</span>
                  </div>
                )}
                <div className="text-sm text-slate-500 mt-2">
                  {relationship.interaction_count} {relationship.interaction_count === 1 ? 'interaction' : 'interactions'} total
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Interaction Timeline */}
        <div>
          <h3
            className="text-2xl text-slate-800 mb-4"
            style={{
              fontFamily: 'Georgia, serif',
              fontStyle: 'italic',
            }}
          >
            Interaction History
          </h3>
          <ContactInteractionTimeline relationshipId={relationship.id} />
        </div>
      </div>
    </div>
  )
}

