import { useState, useEffect } from "react";
import { Contact, Interaction } from "../App";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import {
  MessageCircle,
  Calendar,
  Video,
  Phone,
  Mail,
  Coffee,
  Shuffle,
  ArrowLeft,
  Settings,
  ArrowUp,
} from "lucide-react";

interface AdvicePageProps {
  contacts: Contact[];
  interactions: Interaction[];
  onBack: () => void;
  onNavigate: (
    page: "home" | "logger" | "advice" | "settings",
  ) => void;
}

export function AdvicePage({
  contacts,
  interactions,
  onBack,
  onNavigate,
}: AdvicePageProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>(
    [],
  );
  const [userQuestion, setUserQuestion] = useState("");
  const [chatInput, setChatInput] = useState("");

  const actionTypes = [
    {
      type: "message" as const,
      template: "Send a thoughtful text to someone",
      icon: "message" as const,
    },
    {
      type: "calendar" as const,
      template: "Schedule a lunch date",
      icon: "calendar" as const,
    },
    {
      type: "video" as const,
      template: "Set up a video call",
      icon: "video" as const,
    },
    {
      type: "phone" as const,
      template: "Make a phone call to catch up",
      icon: "phone" as const,
    },
    {
      type: "email" as const,
      template: "Write a meaningful email",
      icon: "email" as const,
    },
    {
      type: "coffee" as const,
      template: "Grab coffee with a friend",
      icon: "coffee" as const,
    },
  ];

  const generateSuggestions = () => {
    // Generate 3 random general action suggestions
    const shuffled = [...actionTypes].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, 3);
    
    const newSuggestions: Suggestion[] = selected.map((action) => ({
      icon: action.icon,
      action: action.template,
      contactName: "",
    }));

    setSuggestions(newSuggestions);
  };

  useEffect(() => {
    generateSuggestions();
  }, [contacts, interactions]);

  const getIcon = (iconType: string) => {
    switch (iconType) {
      case "message":
        return <MessageCircle className="w-16 h-16" />;
      case "calendar":
        return <Calendar className="w-16 h-16" />;
      case "video":
        return <Video className="w-16 h-16" />;
      case "phone":
        return <Phone className="w-16 h-16" />;
      case "email":
        return <Mail className="w-16 h-16" />;
      case "coffee":
        return <Coffee className="w-16 h-16" />;
      default:
        return <MessageCircle className="w-16 h-16" />;
    }
  };

  const handleChatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (chatInput.trim()) {
      // Handle chat input (placeholder for future functionality)
      console.log("Chat input:", chatInput);
      setChatInput("");
    }
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
              <button
                onClick={() => onNavigate("logger")}
                className="text-slate-600 hover:text-slate-800 transition-colors"
              >
                Log Connection
              </button>
              <button className="text-slate-700 hover:text-slate-900 transition-colors">
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
      <div className="max-w-4xl mx-auto px-8 py-12 pb-32">
        <div className="text-center mb-12">
          <h2
            className="text-6xl text-slate-800 mb-12"
            style={{
              fontFamily: "Georgia, serif",
              fontStyle: "italic",
            }}
          >
            Get some advice on...
          </h2>

          {/* Suggestion Cards */}
          {suggestions.length > 0 ? (
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  className="bg-white/50 backdrop-blur-sm rounded-3xl p-8 shadow-lg border border-white/50 hover:bg-white/70 transition-all group"
                >
                  <div className="text-sky-400 mb-6 flex justify-center group-hover:scale-110 transition-transform">
                    {getIcon(suggestion.icon)}
                  </div>
                  <p className="text-sky-400 group-hover:text-sky-500 transition-colors">
                    {suggestion.action}
                  </p>
                </button>
              ))}
            </div>
          ) : (
            <div className="bg-white/40 backdrop-blur-md rounded-3xl p-12 shadow-lg border border-white/50 mb-8">
              <p className="text-slate-600">
                Add some contacts to get personalized
                suggestions!
              </p>
            </div>
          )}

          {/* Shuffle Button */}
          {suggestions.length > 0 && (
            <button
              onClick={generateSuggestions}
              className="text-sky-400 hover:text-sky-500 transition-colors flex items-center gap-2 mx-auto"
            >
              shuffle suggestions
              <Shuffle className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Chat Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/20 backdrop-blur-md border-t border-white/30 p-6">
        <div className="max-w-4xl mx-auto">
          <form onSubmit={handleChatSubmit} className="flex items-center gap-3">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Ask for advice or suggestions..."
              className="flex-1 bg-white/60 backdrop-blur-sm border border-white/50 rounded-full px-6 py-3 text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-400/50 focus:border-transparent"
            />
            <button
              type="submit"
              disabled={!chatInput.trim()}
              className="w-10 h-10 rounded-full bg-sky-400 hover:bg-sky-500 disabled:bg-slate-300 disabled:cursor-not-allowed text-white flex items-center justify-center transition-all shadow-md"
            >
              <ArrowUp className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}