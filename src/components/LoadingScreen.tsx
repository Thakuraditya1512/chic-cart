import React from 'react';

interface LoadingScreenProps {
  variant?: 'default' | 'product';
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ variant = 'default' }) => {
  return (
    <div className="loading-screen flex-col">
      {variant === 'product' ? (
        <div className="shoe-container">
          <svg viewBox="0 0 24 24" className="shoe-icon-base">
            <path d="M21.1 12c-.1-.1-.2-.1-.3-.2l-2.6-1.5c-.3-.2-.5-.5-.7-.8L16 6.7c-.5-1-.9-1.7-2-1.7h-3c-1.1 0-2 .9-2 2v1.3c0 .3-.1.5-.2.7L6.6 11c-.3.3-.6.4-1 .4H4c-1.1 0-2 .9-2 2v3c0 .6.4 1 1 1h16c.1 0 .3 0 .4-.1l2.5-1.5c.6-.4.8-1.2.4-1.8-.1-.4-.4-.7-.8-.8zM18 16H8v-2h10l-1.3 2H18z" />
          </svg>
          <div className="shoe-icon-fill-container">
            <svg viewBox="0 0 24 24" className="shoe-icon-fill">
              <path d="M21.1 12c-.1-.1-.2-.1-.3-.2l-2.6-1.5c-.3-.2-.5-.5-.7-.8L16 6.7c-.5-1-.9-1.7-2-1.7h-3c-1.1 0-2 .9-2 2v1.3c0 .3-.1.5-.2.7L6.6 11c-.3.3-.6.4-1 .4H4c-1.1 0-2 .9-2 2v3c0 .6.4 1 1 1h16c.1 0 .3 0 .4-.1l2.5-1.5c.6-.4.8-1.2.4-1.8-.1-.4-.4-.7-.8-.8zM18 16H8v-2h10l-1.3 2H18z" />
            </svg>
          </div>
        </div>
      ) : (
        <div className="loading-text" data-text="FLEX THE KICKS">
          FLEX THE KICKS
        </div>
      )}
    </div>
  );
};

export default LoadingScreen;
