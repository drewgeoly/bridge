'use client'

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Tag } from 'lucide-react'

export type EventCategory = 'social' | 'work' | 'personal' | 'family' | 'other' | null

interface EventLabelSelectorProps {
  value: EventCategory
  onValueChange: (value: EventCategory) => void
  disabled?: boolean
}

const categoryConfig: Record<NonNullable<EventCategory>, { label: string; color: string; bgColor: string }> = {
  social: { label: 'Social', color: 'text-blue-700', bgColor: 'bg-blue-100 border-blue-300' },
  work: { label: 'Work', color: 'text-green-700', bgColor: 'bg-green-100 border-green-300' },
  personal: { label: 'Personal', color: 'text-purple-700', bgColor: 'bg-purple-100 border-purple-300' },
  family: { label: 'Family', color: 'text-orange-700', bgColor: 'bg-orange-100 border-orange-300' },
  other: { label: 'Other', color: 'text-slate-700', bgColor: 'bg-slate-100 border-slate-300' },
}

export function EventLabelSelector({ value, onValueChange, disabled }: EventLabelSelectorProps) {
  const handleValueChange = (newValue: string) => {
    if (newValue === 'none') {
      onValueChange(null)
    } else {
      onValueChange(newValue as EventCategory)
    }
  }

  const currentCategory = value ? categoryConfig[value] : null

  return (
    <div className="flex items-center gap-2">
      <Tag className="w-4 h-4 text-slate-600" />
      <Select
        value={value || 'none'}
        onValueChange={handleValueChange}
        disabled={disabled}
      >
        <SelectTrigger className="w-[140px]">
          <SelectValue>
            {currentCategory ? (
              <Badge
                variant="outline"
                className={`${currentCategory.bgColor} ${currentCategory.color} border`}
              >
                {currentCategory.label}
              </Badge>
            ) : (
              <span className="text-slate-500">No label</span>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">
            <span className="text-slate-500">No label</span>
          </SelectItem>
          {Object.entries(categoryConfig).map(([key, config]) => (
            <SelectItem key={key} value={key}>
              <Badge
                variant="outline"
                className={`${config.bgColor} ${config.color} border`}
              >
                {config.label}
              </Badge>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

