'use client'

import { useState, useMemo } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useAdviceConversationStore } from '@/lib/stores/advice-conversation.store'
import { useRelationships } from '@/lib/hooks/use-relationships'
import { ArrowRight, Search, UserPlus } from 'lucide-react'

interface FriendSelectionStepProps {
  onNext: () => void
  onBack: () => void
}

export function FriendSelectionStep({ onNext, onBack }: FriendSelectionStepProps) {
  const { setFriend, setStep } = useAdviceConversationStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFriend, setSelectedFriend] = useState<{ id?: string; name: string } | null>(null)
  
  const { data: relationshipsData, isLoading } = useRelationships({ limit: 50 })
  const relationships = relationshipsData?.relationships || []

  // Filter and search friends
  const filteredFriends = useMemo(() => {
    const friends = relationships.map((rel) => ({
      id: rel.person_id,
      name: rel.person?.name || 'Unknown',
    }))

    if (!searchQuery.trim()) {
      return friends
    }

    const query = searchQuery.toLowerCase()
    return friends.filter((friend) => friend.name.toLowerCase().includes(query))
  }, [relationships, searchQuery])

  // Create dynamic friend from search if not found
  const showCreateOption = searchQuery.trim() && 
    !filteredFriends.some(f => f.name.toLowerCase() === searchQuery.toLowerCase())

  const handleFriendSelect = (friend: { id?: string; name: string }) => {
    setSelectedFriend(friend)
    setFriend(friend)
    setTimeout(() => {
      setStep(3)
      onNext()
    }, 300)
  }

  const handleCreateFriend = () => {
    if (searchQuery.trim()) {
      const newFriend = { name: searchQuery.trim() }
      handleFriendSelect(newFriend)
    }
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-4xl text-slate-800 mb-4" style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
          Which friend?
        </h2>
        <p className="text-slate-600">Select a friend or type their name</p>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <Input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search for a friend..."
          className="bg-white/60 backdrop-blur-sm border-white/50 rounded-full pl-12 pr-6 py-3 text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-400/50"
          autoFocus
        />
      </div>

      {/* Friend Cards */}
      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-slate-600">Loading contacts...</p>
        </div>
      ) : (
        <>
          {showCreateOption && (
            <button
              onClick={handleCreateFriend}
              className="w-full bg-white/50 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/50 hover:bg-white/70 transition-all text-left"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-sky-100 flex items-center justify-center">
                  <UserPlus className="w-6 h-6 text-sky-400" />
                </div>
                <div>
                  <p className="font-semibold text-slate-800">Create: {searchQuery}</p>
                  <p className="text-sm text-slate-600">Add as new friend</p>
                </div>
              </div>
            </button>
          )}

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
            {filteredFriends.map((friend) => {
              const initials = friend.name
                .split(' ')
                .map((n) => n[0])
                .join('')
                .toUpperCase()
                .slice(0, 2)
              
              const isSelected = selectedFriend?.id === friend.id && selectedFriend?.name === friend.name

              return (
                <button
                  key={friend.id || friend.name}
                  onClick={() => handleFriendSelect(friend)}
                  className={`bg-white/50 backdrop-blur-sm rounded-2xl p-6 shadow-lg border-2 transition-all text-left ${
                    isSelected
                      ? 'border-sky-400 bg-white/70'
                      : 'border-white/50 hover:bg-white/70 hover:border-white/70'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <Avatar className="w-12 h-12">
                      <AvatarFallback className="bg-sky-100 text-sky-600">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold text-slate-800">{friend.name}</p>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>

          {filteredFriends.length === 0 && !showCreateOption && (
            <div className="text-center py-12">
              <p className="text-slate-600">No friends found. Try searching or creating a new one.</p>
            </div>
          )}
        </>
      )}

      {/* Back Button */}
      <div className="flex justify-start pt-4">
        <Button
          onClick={onBack}
          variant="ghost"
          className="text-slate-600 hover:text-slate-800"
        >
          ← Back
        </Button>
      </div>
    </div>
  )
}

