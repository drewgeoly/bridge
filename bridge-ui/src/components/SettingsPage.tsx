import { useState } from "react";
import { Settings, Calendar, Check } from "lucide-react";
import { Button } from "./ui/button";

interface SettingsPageProps {
  onBack: () => void;
  onNavigate: (
    page: "home" | "logger" | "advice" | "settings",
  ) => void;
}

export function SettingsPage({
  onBack,
  onNavigate,
}: SettingsPageProps) {
  const [isCalendarSynced, setIsCalendarSynced] =
    useState(false);
  const [usageFrequency, setUsageFrequency] =
    useState<string>("");
  const [advicePreference, setAdvicePreference] =
    useState<string>("");

  const handleCalendarSync = () => {
    // Mock calendar sync - in real app would integrate with Google Calendar API
    setIsCalendarSynced(true);
    setTimeout(() => {
      alert("Google Calendar synced successfully!");
    }, 500);
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
        <div className="mb-16">
          <h2
            className="text-6xl text-slate-800 mb-4"
            style={{
              fontFamily: "Georgia, serif",
              fontStyle: "italic",
            }}
          >
            Set Up
          </h2>
          <p className="text-xl text-slate-600">
            Customize your Bridge experience
          </p>
        </div>

        <div className="space-y-8">
          {/* Google Calendar Integration */}
          <div className="bg-white/40 backdrop-blur-md rounded-3xl p-8 shadow-lg border border-white/50">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-white/60 backdrop-blur-sm flex items-center justify-center">
                  <Calendar className="w-7 h-7 text-slate-700" />
                </div>
                <div>
                  <h3
                    className="text-2xl text-slate-800 mb-2"
                    style={{
                      fontFamily: "Georgia, serif",
                      fontStyle: "italic",
                    }}
                  >
                    Google Calendar
                  </h3>
                  <p className="text-slate-600">
                    Sync your connections to see them in your
                    calendar
                  </p>
                </div>
              </div>
              {isCalendarSynced && (
                <div className="flex items-center gap-2 text-green-600">
                  <Check className="w-5 h-5" />
                  <span>Synced</span>
                </div>
              )}
            </div>
            <button
              onClick={handleCalendarSync}
              disabled={isCalendarSynced}
              className={`w-full py-4 rounded-2xl ${
                isCalendarSynced
                  ? "bg-green-100 text-green-700 cursor-not-allowed"
                  : "bg-white/60 backdrop-blur-sm text-slate-700 hover:bg-white/80"
              } transition-all`}
            >
              {isCalendarSynced
                ? "Calendar Connected"
                : "Connect Google Calendar"}
            </button>
          </div>

          {/* Usage Frequency */}
          <div className="bg-white/40 backdrop-blur-md rounded-3xl p-8 shadow-lg border border-white/50">
            <h3
              className="text-2xl text-slate-800 mb-4"
              style={{
                fontFamily: "Georgia, serif",
                fontStyle: "italic",
              }}
            >
              How often do you plan to use Bridge?
            </h3>
            <p className="text-slate-600 mb-6">
              This helps us tailor reminders and suggestions
            </p>
            <div className="space-y-3">
              {[
                {
                  value: "daily",
                  label:
                    "Daily - I want to stay on top of my connections",
                },
                {
                  value: "few-times-week",
                  label:
                    "A few times a week - Regular check-ins",
                },
                {
                  value: "weekly",
                  label:
                    "Weekly - Once a week is enough for me",
                },
                {
                  value: "occasionally",
                  label: "Occasionally - When I remember",
                },
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() =>
                    setUsageFrequency(option.value)
                  }
                  className={`w-full p-5 rounded-2xl text-left transition-all ${
                    usageFrequency === option.value
                      ? "bg-sky-100 border-2 border-sky-300"
                      : "bg-white/60 backdrop-blur-sm hover:bg-white/80 border-2 border-transparent"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-slate-700">
                      {option.label}
                    </span>
                    {usageFrequency === option.value && (
                      <Check className="w-5 h-5 text-sky-600" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Advice Preference */}
          <div className="bg-white/40 backdrop-blur-md rounded-3xl p-8 shadow-lg border border-white/50">
            <h3
              className="text-2xl text-slate-800 mb-4"
              style={{
                fontFamily: "Georgia, serif",
                fontStyle: "italic",
              }}
            >
              What kind of advice would you like to receive?
            </h3>
            <p className="text-slate-600 mb-6">
              We'll customize suggestions based on your
              preferences
            </p>
            <div className="space-y-3">
              {[
                {
                  value: "practical",
                  label:
                    "Practical suggestions - Simple, actionable ideas",
                },
                {
                  value: "thoughtful",
                  label:
                    "Thoughtful prompts - Deeper connection ideas",
                },
                {
                  value: "spontaneous",
                  label:
                    "Spontaneous activities - Fun, creative suggestions",
                },
                {
                  value: "scheduled",
                  label:
                    "Scheduled reminders - Help me plan ahead",
                },
                {
                  value: "all",
                  label: "Mix of everything - Surprise me!",
                },
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() =>
                    setAdvicePreference(option.value)
                  }
                  className={`w-full p-5 rounded-2xl text-left transition-all ${
                    advicePreference === option.value
                      ? "bg-sky-100 border-2 border-sky-300"
                      : "bg-white/60 backdrop-blur-sm hover:bg-white/80 border-2 border-transparent"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-slate-700">
                      {option.label}
                    </span>
                    {advicePreference === option.value && (
                      <Check className="w-5 h-5 text-sky-600" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-center pt-4">
            <button
              onClick={onBack}
              className="px-12 py-4 rounded-2xl bg-sky-400 text-white hover:bg-sky-500 transition-all shadow-lg"
            >
              Save Preferences
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}