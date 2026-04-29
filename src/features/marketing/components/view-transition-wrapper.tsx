'use client';

import * as React from 'react';

interface ViewTransitionWrapperProps {
  children: React.ReactNode;
  className?: string;
}

export default function ViewTransitionWrapper({ children, className }: ViewTransitionWrapperProps) {
  const reactMaybe = React as unknown as {
    ViewTransition?: React.ComponentType<React.PropsWithChildren<Record<string, unknown>>>;
  };

  const VT = reactMaybe.ViewTransition;

  if (!VT) {
    return <>{children}</>;
  }

  return (
    <VT enter={className ?? 'vt-fade'} exit={className ?? 'vt-fade'} default='none'>
      {children}
    </VT>
  );
}
