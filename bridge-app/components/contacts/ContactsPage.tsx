'use client'

import { useState } from 'react'
import { useRelationships } from '@/lib/hooks/use-relationships'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Search, Users, Filter, ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface ContactsPageProps {
  onBack?: () => void
  onNavigate?: (page: 'home' | 'logger' | 'advice' | 'settings' | 'contacts') => void
  onContactSelect?: (contactId: string) => void
}

export function ContactsPage({ onBack, onNavigate, onContactSelect }: ContactsPageProps) {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [relationshipFilter, setRelationshipFilter] = useState<string | null>(null)
  
  const { data: relationshipsData, isLoading } = useRelationships({ limit: 1000 })
  
  const relationships = relationshipsData?.relationships || []
  
  // Get unique relationship types for filter
  const relationshipTypes = Array.from(
    new Set(
      relationships
        .map(r => r.metadata?.relationship as string | undefined)
        .filter((x): x is string => Boolean(x))
    )
  ).sort()

  // Filter contacts
  const filteredContacts = relationships.filter((rel) => {
    const personName = rel.person?.name || ''
    const relationship = (rel.metadata?.relationship as string) || ''
    
    // Search filter
    const matchesSearch = !searchQuery || 
      personName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      relationship.toLowerCase().includes(searchQuery.toLowerCase())
    
    // Relationship filter
    const matchesRelationship = !relationshipFilter || 
      (rel.metadata?.relationship as string) === relationshipFilter
    
    return matchesSearch && matchesRelationship
  })

  const handleNavigate = (page: 'home' | 'logger' | 'advice' | 'settings' | 'contacts') => {
    if (onNavigate) {
      onNavigate(page)
    } else {
      router.push(`/${page === 'home' ? '' : page}`)
    }
  }

  const handleContactClick = (contactId: string) => {
    if (onContactSelect) {
      onContactSelect(contactId)
    } else {
      // Navigate to contact detail view
      handleNavigate('contacts')
    }
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
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="border-b border-white/30 bg-white/20 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <button
              onClick={onBack || (() => handleNavigate('home'))}
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
            <div className="flex gap-6">
              <button
                onClick={() => handleNavigate('logger')}
                className="text-slate-600 hover:text-slate-800 transition-colors"
              >
                Log Connection
              </button>
              <button
                onClick={() => handleNavigate('advice')}
                className="text-slate-600 hover:text-slate-800 transition-colors"
              >
                Get Advice
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <h2
            className="text-4xl text-slate-800 mb-2"
            style={{
              fontFamily: 'Georgia, serif',
              fontStyle: 'italic',
            }}
          >
            Contacts
          </h2>
          <p className="text-slate-600">
            {filteredContacts.length} {filteredContacts.length === 1 ? 'contact' : 'contacts'}
          </p>
        </div>

        {/* Search and Filter */}
        <div className="mb-6 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <Input
              type="text"
              placeholder="Search contacts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white/80 backdrop-blur-sm border-white/50 h-11"
            />
          </div>

          {/* Relationship Filter */}
          {relationshipTypes.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <Filter className="w-4 h-4 text-slate-600" />
              <span className="text-sm text-slate-600">Filter by:</span>
              <Button
                variant={relationshipFilter === null ? 'default' : 'outline'}
                size="sm"
                onClick={() => setRelationshipFilter(null)}
                className="h-8"
              >
                All
              </Button>
              {relationshipTypes.map((type) => (
                <Button
                  key={type}
                  variant={relationshipFilter === type ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setRelationshipFilter(type)}
                  className="h-8"
                >
                  {type}
                </Button>
              ))}
            </div>
          )}
        </div>

        {/* Contacts List */}
        {isLoading ? (
          <div className="text-center py-12 text-slate-600">Loading contacts...</div>
        ) : filteredContacts.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-16 h-16 mx-auto mb-4 text-slate-400" />
            <p className="text-slate-600 mb-2">
              {searchQuery || relationshipFilter
                ? 'No contacts match your filters'
                : 'No contacts yet'}
            </p>
            {searchQuery || relationshipFilter ? (
              <Button
                variant="outline"
                onClick={() => {
                  setSearchQuery('')
                  setRelationshipFilter(null)
                }}
                className="mt-4"
              >
                Clear filters
              </Button>
            ) : null}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredContacts.map((relationship) => {
              const person = relationship.person
              const name = person?.name || 'Unknown'
              const relationshipType = (relationship.metadata?.relationship as string) || undefined
              
              return (
                <Card
                  key={relationship.id}
                  className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 border border-white/50 hover:bg-white/80 transition-all cursor-pointer"
                  onClick={() => handleContactClick(relationship.person_id)}
                >
                  <div className="flex items-start gap-4">
                    <Avatar className="w-12 h-12 flex-shrink-0">
                      <AvatarFallback className="bg-sky-100 text-sky-700 text-sm">
                        {getInitials(name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="text-slate-800 font-medium mb-1 truncate">
                        {name}
                      </div>
                      {relationshipType && (
                        <div className="text-sm text-slate-600 mb-1">
                          {relationshipType}
                        </div>
                      )}
                      {person?.email && (
                        <div className="text-xs text-slate-500 truncate">
                          {person.email}
                        </div>
                      )}
                      <div className="text-xs text-slate-400 mt-2">
                        {relationship.interaction_count} {relationship.interaction_count === 1 ? 'interaction' : 'interactions'}
                      </div>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

