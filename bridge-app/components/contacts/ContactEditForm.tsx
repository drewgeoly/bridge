'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { ArrowLeft, Save, Loader2 } from 'lucide-react'
import { API_ENDPOINTS } from '@/lib/api/endpoints'
import type { Relationship } from '@/types/database'

interface ContactEditFormProps {
  relationship: Relationship & { person: { name?: string; email?: string; phone_numbers?: string[] } }
  onCancel: () => void
  onSave: () => void
}

export function ContactEditForm({ relationship, onCancel, onSave }: ContactEditFormProps) {
  const queryClient = useQueryClient()
  const [name, setName] = useState(relationship.person?.name || '')
  const [relationshipType, setRelationshipType] = useState(
    (relationship.metadata?.relationship as string) || ''
  )

  const updateMutation = useMutation({
    mutationFn: async (data: { name?: string; relationship?: string }) => {
      const response = await fetch(`${API_ENDPOINTS.relationships}/${relationship.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          metadata: {
            ...relationship.metadata,
            relationship: data.relationship,
          },
        }),
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update contact')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['relationships'] })
      onSave()
    },
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await updateMutation.mutateAsync({
      relationship: relationshipType.trim() || undefined,
    })
  }

  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="border-b border-white/30 bg-white/20 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onCancel}
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

      {/* Form */}
      <div className="max-w-2xl mx-auto px-8 py-12">
        <Card className="bg-white/60 backdrop-blur-sm rounded-3xl p-8 shadow-lg border border-white/50">
          <h2
            className="text-2xl text-slate-800 mb-6"
            style={{
              fontFamily: 'Georgia, serif',
              fontStyle: 'italic',
            }}
          >
            Edit Contact
          </h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Contact name"
                className="bg-white h-10"
                disabled
              />
              <p className="text-xs text-slate-500">Name cannot be edited here</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="relationship" className="text-sm font-medium">Relationship</Label>
              <Input
                id="relationship"
                value={relationshipType}
                onChange={(e) => setRelationshipType(e.target.value)}
                placeholder="e.g., Friend, Colleague, Family"
                className="bg-white h-10"
                disabled={updateMutation.isPending}
              />
              <p className="text-xs text-slate-500">How would you describe your relationship?</p>
            </div>

            <div className="flex gap-3 justify-end pt-4">
              <Button
                type="button"
                variant="ghost"
                onClick={onCancel}
                disabled={updateMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={updateMutation.isPending}
                className="bg-slate-700 hover:bg-slate-800 min-w-[120px]"
              >
                {updateMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  )
}

