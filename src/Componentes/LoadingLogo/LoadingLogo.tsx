'use client';

import React from 'react';

interface LoadingLogoProps {
	mensagem?: string;
	loading: boolean;
}

const LoadingLogo: React.FC<LoadingLogoProps> = ({ mensagem, loading }) => {
	if (!loading) return null;

	return (
		<>
			<div className='loaderContainer'>
				<div className='minimal-card'>
					<div className='minimal-spinner'></div>
					{mensagem && <p className='loading-text'>{mensagem}</p>}
				</div>
			</div>

			<style>{`
        .loaderContainer {
          position: fixed;
          inset: 0;
          display: flex;
          justify-content: center;
          align-items: center;
          /* Seu z-index original mantido */
          z-index: 1002; 
          background-color: rgba(255, 255, 255, 0.2); 
          -webkit-backdrop-filter: blur(12px);
          backdrop-filter: blur(12px);
        }

        .minimal-card {
          background: #ffffff; /* Branco sólido para saltar no meio do blur */
          padding: 30px;
          border-radius: 8px;
          display: flex;
          flex-direction: column;
          align-items: center;
          /* Sombra mais forte para dar profundidade e visibilidade */
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
          border: 1px solid rgba(0, 0, 0, 0.05);
          min-width: 200px;
        }

        .minimal-spinner {
          width: 40px;
          height: 40px;
          border: 4px solid rgba(0, 0, 0, 0.05); 
          border-top: 4px solid #000; /* Destaque preto total */
          border-radius: 50%;
          animation: spin 0.5s linear infinite;
        }

        .loading-text {
          margin-top: 24px;
          font-family: system-ui, -apple-system, sans-serif;
          font-size: 14px;
          color: #000;
          font-weight: 700;
          letter-spacing: 1px;
          text-transform: uppercase;
          text-align: center;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
		</>
	);
};

export default LoadingLogo;
