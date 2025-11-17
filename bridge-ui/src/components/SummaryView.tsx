import { Contact, Interaction } from '../App';
import { Users, Calendar as CalendarIcon, TrendingUp } from 'lucide-react';

interface SummaryViewProps {
  contacts: Contact[];
  interactions: Interaction[];
}

export function SummaryView({ contacts, interactions }: SummaryViewProps) {
  const thisMonth = new Date().getMonth();
  const thisYear = new Date().getFullYear();
  
  const interactionsThisMonth = interactions.filter(i => {
    const date = new Date(i.date);
    return date.getMonth() === thisMonth && date.getFullYear() === thisYear;
  }).length;

  const recentInteractions = interactions
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="text-center p-4 rounded-lg bg-blue-50 border border-blue-100">
          <Users className="w-6 h-6 text-blue-600 mx-auto mb-2" />
          <div className="text-slate-900">{contacts.length}</div>
          <div className="text-slate-600">Contacts</div>
        </div>
        <div className="text-center p-4 rounded-lg bg-green-50 border border-green-100">
          <CalendarIcon className="w-6 h-6 text-green-600 mx-auto mb-2" />
          <div className="text-slate-900">{interactionsThisMonth}</div>
          <div className="text-slate-600">This Month</div>
        </div>
        <div className="text-center p-4 rounded-lg bg-purple-50 border border-purple-100">
          <TrendingUp className="w-6 h-6 text-purple-600 mx-auto mb-2" />
          <div className="text-slate-900">{interactions.length}</div>
          <div className="text-slate-600">Total</div>
        </div>
      </div>

      {/* Recent Activity */}
      {recentInteractions.length > 0 && (
        <div>
          <h3 className="text-slate-700 mb-3">Recent Connections</h3>
          <div className="space-y-2">
            {recentInteractions.map((interaction) => (
              <div
                key={interaction.id}
                className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100"
              >
                <div>
                  <div className="text-slate-900">{interaction.contactName}</div>
                  <div className="text-slate-600">{interaction.method}</div>
                </div>
                <div className="text-slate-500">
                  {new Date(interaction.date).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {recentInteractions.length === 0 && (
        <div className="text-center p-8 text-slate-500">
          No interactions logged yet. Start by logging your first connection!
        </div>
      )}
    </div>
  );
}
