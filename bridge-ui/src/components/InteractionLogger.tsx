import { useState } from "react";
import { Contact, Interaction } from "../App";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Calendar } from "./ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "./ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "./ui/popover";
import { Settings, Check, ChevronsUpDown, CalendarIcon, Plus, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "./ui/utils";

interface InteractionLoggerProps {
  contacts: Contact[];
  onAddInteraction: (interaction: Interaction) => void;
  onBack: () => void;
  onNavigate: (page: "home" | "logger" | "advice" | "settings") => void;
}

export function InteractionLogger({
  contacts,
  onAddInteraction,
  onBack,
  onNavigate,
}: InteractionLoggerProps) {
  const [selectedContact, setSelectedContact] = useState('');
  const [open, setOpen] = useState(false);
  const [dateOpen, setDateOpen] = useState(false);
  const [method, setMethod] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState<Date>(new Date());
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const contact = contacts.find(c => c.id === selectedContact);
    if (!contact || !method) return;

    const newInteraction: Interaction = {
      id: Date.now().toString(),
      contactId: contact.id,
      contactName: contact.name,
      method,
      description: description || undefined,
      date,
    };

    onAddInteraction(newInteraction);
    
    // Show success message
    setShowSuccess(true);
    
    // Reset form
    setSelectedContact('');
    setOpen(false);
    setMethod('');
    setDescription('');
    setDate(new Date());
    
    // Hide success message after 2 seconds
    setTimeout(() => setShowSuccess(false), 2000);
  };

  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="border-b border-white/30 bg-white/20 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <button 
              onClick={onBack}
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
                onClick={() => onNavigate("advice")}
                className="text-slate-600 hover:text-slate-800 transition-colors"
              >
                Get Advice
              </button>
            </div>
          </div>
          <button
            onClick={() => onNavigate("settings")}
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
                      className={cn(
                        "w-full justify-start bg-white/80 backdrop-blur-sm border-white/50 h-12 text-left hover:bg-white/90",
                        !date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={(selectedDate) => {
                        if (selectedDate) {
                          setDate(selectedDate);
                          setDateOpen(false);
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
                      role="combobox"
                      aria-expanded={open}
                      className="w-full justify-between bg-white/80 backdrop-blur-sm border-white/50 h-12 text-slate-700 hover:bg-white/90"
                    >
                      {selectedContact
                        ? contacts.find((contact) => contact.id === selectedContact)?.name
                        : "Search for a contact..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Search contacts..." className="h-9" />
                      <CommandList>
                        <CommandEmpty>No contacts found.</CommandEmpty>
                        <CommandGroup>
                          {contacts.map((contact) => (
                            <CommandItem
                              key={contact.id}
                              value={contact.name}
                              onSelect={() => {
                                setSelectedContact(contact.id);
                                setOpen(false);
                              }}
                            >
                              {contact.name}
                              {contact.relationship && (
                                <span className="text-slate-500 ml-2">• {contact.relationship}</span>
                              )}
                              <Check
                                className={`ml-auto h-4 w-4 ${
                                  selectedContact === contact.id ? "opacity-100" : "opacity-0"
                                }`}
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

              {/* Submit - Option 1: Icon button with text */}
              <div className="flex items-center gap-4 pt-4">
                <Button 
                  type="submit" 
                  className="h-10 px-5 bg-white/60 hover:bg-white/80 text-slate-700 hover:text-slate-800 border border-white/50 backdrop-blur-sm transition-all rounded-full"
                  disabled={!selectedContact || !method || !date}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Save
                </Button>
                <Button 
                  type="button"
                  variant="ghost"
                  onClick={onBack}
                  className="h-10 px-5 text-slate-500 hover:text-slate-700"
                >
                  Cancel
                </Button>
              </div>

              {/* Success Message */}
              {showSuccess && (
                <div className="flex items-center gap-2 p-4 bg-white/60 backdrop-blur-sm border border-white/50 rounded-lg text-slate-700">
                  <CheckCircle2 className="w-5 h-5" />
                  <span>Connection logged successfully!</span>
                </div>
              )}
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}