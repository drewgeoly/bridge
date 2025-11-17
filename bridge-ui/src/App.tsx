import { useState } from 'react';
import { HomePage } from './components/HomePage';
import { InteractionLogger } from './components/InteractionLogger';
import { AdvicePage } from './components/AdvicePage';
import { SettingsPage } from './components/SettingsPage';

type Page = 'home' | 'logger' | 'advice' | 'settings';

export interface Contact {
  id: string;
  name: string;
  relationship?: string;
}

export interface Interaction {
  id: string;
  contactId: string;
  contactName: string;
  method: string;
  description?: string;
  date: Date;
}

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [contacts, setContacts] = useState<Contact[]>([
    { id: '1', name: 'Sarah Mitchell', relationship: 'Friend' },
    { id: '2', name: 'James Chen', relationship: 'Colleague' },
    { id: '3', name: 'Mom', relationship: 'Family' },
  ]);
  const [interactions, setInteractions] = useState<Interaction[]>([
    {
      id: '1',
      contactId: '1',
      contactName: 'Sarah Mitchell',
      method: 'Coffee',
      description: 'Caught up over coffee downtown',
      date: new Date('2025-11-10'),
    },
    {
      id: '2',
      contactId: '3',
      contactName: 'Mom',
      method: 'Phone call',
      date: new Date('2025-11-14'),
    },
  ]);

  const addContact = (contact: Contact) => {
    setContacts([...contacts, contact]);
  };

  const addInteraction = (interaction: Interaction) => {
    setInteractions([...interactions, interaction]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-200 via-blue-100 to-amber-100">
      {currentPage === 'home' && (
        <HomePage
          contacts={contacts}
          interactions={interactions}
          onNavigate={setCurrentPage}
          onAddContact={addContact}
        />
      )}
      {currentPage === 'logger' && (
        <InteractionLogger
          contacts={contacts}
          onAddInteraction={addInteraction}
          onBack={() => setCurrentPage('home')}
          onNavigate={setCurrentPage}
        />
      )}
      {currentPage === 'advice' && (
        <AdvicePage
          contacts={contacts}
          interactions={interactions}
          onBack={() => setCurrentPage('home')}
          onNavigate={setCurrentPage}
        />
      )}
      {currentPage === 'settings' && (
        <SettingsPage
          onBack={() => setCurrentPage('home')}
          onNavigate={setCurrentPage}
        />
      )}
    </div>
  );
}