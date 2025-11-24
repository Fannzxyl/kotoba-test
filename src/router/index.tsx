import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

import { Dashboard } from '../pages/Dashboard';
import { Study } from '../pages/Study';
import { Decks } from '../pages/Decks';
import { DeckDetails } from '../pages/DeckDetails';
import { Import } from '../modules/decks/Import';

// Game pages
import { KataCannonGame } from '../game/KataCannonGame';
import { TestMode } from '../pages/TestMode';
import { MatchGame } from '../pages/MatchGame';

export const AppRouter: React.FC = () => {
  return (
    <Routes>
      {/* Dashboard */}
      <Route path="/" element={<Dashboard />} />

      {/* Study (flashcards & arcade mode via query ?mode=...) */}
      <Route path="/study" element={<Study />} />

      {/* Deck management */}
      <Route path="/decks" element={<Decks />} />
      <Route path="/decks/:deckId" element={<DeckDetails />} />

      {/* Import JSON */}
      <Route path="/import" element={<Import />} />

      {/* Arcade standalone (bisa pakai ?deckId=... juga) */}
      <Route
        path="/arcade"
        element={
          <div className="p-4 max-w-4xl mx-auto">
            <KataCannonGame />
          </div>
        }
      />

      {/* New games */}
      <Route path="/test" element={<TestMode />} />
      <Route path="/match" element={<MatchGame />} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};
