import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Dashboard } from '../pages/Dashboard';
import { Study } from '../pages/Study';
import { Decks } from '../pages/Decks';
import { DeckDetails } from '../pages/DeckDetails';
import { Import } from '../modules/decks/Import';
import { KataCannonGame } from '../game/KataCannonGame';

export const AppRouter: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/study" element={<Study />} />
      <Route path="/decks" element={<Decks />} />
      <Route path="/decks/:deckId" element={<DeckDetails />} />
      <Route path="/import" element={<Import />} />
      <Route path="/arcade" element={<div className="p-4 max-w-4xl mx-auto"><KataCannonGame /></div>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};