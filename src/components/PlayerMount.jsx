'use client';

import { usePathname } from 'next/navigation';
import Player from './Player';

const HIDDEN_ROUTES = ['/quickplay'];

export default function PlayerMount() {
  const pathname = usePathname();
  if (HIDDEN_ROUTES.includes(pathname)) return null;
  return <Player />;
}
