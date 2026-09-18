import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import Concord from './Concord';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Concord />
  </StrictMode>
);
