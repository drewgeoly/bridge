'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card'
import { Plus, X, MessageSquare, HelpCircle } from 'lucide-react'
import { format } from 'date-fns'

interface Note {
  text: string
  question?: string
  createdAt: number
}

interface NotesSectionProps {
  notes: Note[]
  onAddNote: (note: { text: string; question?: string }) => Promise<void>
  onDeleteNote: (index: number) => Promise<void>
  disabled?: boolean
}

export function NotesSection({ notes, onAddNote, onDeleteNote, disabled }: NotesSectionProps) {
  const [isAdding, setIsAdding] = useState(false)
  const [noteText, setNoteText] = useState('')
  const [questionText, setQuestionText] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const handleAdd = async () => {
    if (!noteText.trim()) return

    setIsSaving(true)
    try {
      await onAddNote({
        text: noteText.trim(),
        question: questionText.trim() || undefined,
      })
      setNoteText('')
      setQuestionText('')
      setIsAdding(false)
    } catch (error) {
      console.error('Failed to add note:', error)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
          <MessageSquare className="w-5 h-5" />
          Notes & Questions
        </h3>
        {!disabled && !isAdding && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Note
          </Button>
        )}
      </div>

      {/* Add Note Form */}
      {isAdding && !disabled && (
        <Card className="bg-white/60 backdrop-blur-sm rounded-lg p-4 border border-white/50">
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">Note</label>
              <Textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Add a note about this interaction..."
                className="bg-white min-h-[80px]"
                disabled={isSaving}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block flex items-center gap-1">
                <HelpCircle className="w-3.5 h-3.5" />
                Question (optional)
              </label>
              <Input
                value={questionText}
                onChange={(e) => setQuestionText(e.target.value)}
                placeholder="e.g., What should I follow up on?"
                className="bg-white"
                disabled={isSaving}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsAdding(false)
                  setNoteText('')
                  setQuestionText('')
                }}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleAdd}
                disabled={!noteText.trim() || isSaving}
                className="bg-slate-700 hover:bg-slate-800"
              >
                {isSaving ? 'Saving...' : 'Save Note'}
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Notes List */}
      {notes.length === 0 && !isAdding ? (
        <div className="text-center py-8 text-slate-500 text-sm">
          No notes yet. Add a note to remember important details.
        </div>
      ) : (
        <div className="space-y-3">
          {notes.map((note, index) => (
            <Card
              key={index}
              className="bg-white/60 backdrop-blur-sm rounded-lg p-4 border border-white/50"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="text-slate-800 mb-2 whitespace-pre-wrap">{note.text}</div>
                  {note.question && (
                    <div className="flex items-start gap-2 mt-2 p-2 bg-amber-50 rounded border border-amber-200">
                      <HelpCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                      <div className="text-sm text-amber-900">{note.question}</div>
                    </div>
                  )}
                  <div className="text-xs text-slate-500 mt-2">
                    {format(new Date(note.createdAt), 'MMM d, yyyy h:mm a')}
                  </div>
                </div>
                {!disabled && (
                  <button
                    onClick={() => onDeleteNote(index)}
                    className="text-slate-400 hover:text-slate-600 transition-colors flex-shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

