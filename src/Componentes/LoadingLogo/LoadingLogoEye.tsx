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
				{/* Usando o componente Image do Next.js para melhor performance */}
				{/* Se não tiver Next.js, mantenha o <img>, mas com a classe 'loading-logo' */}
				<img
					src='/Ceres1_ncenter.svg'
					alt='Ceres Loading'
					className='loading-logo'
					width={125}
					height={125}
					// Garante que o SVG mantenha a proporção sem distorcer
					style={{ height: 'auto' }}
				/>

				{/* O spinner agora é um elemento simples, centralizado pelo pai */}
				<span className='loader-spinner'></span>

				{/* Texto do loading, dinâmico */}
				{mensagem && <p className='loading-text'>{mensagem}</p>}
			</div>

			<style>{`
        /* 1. Container Principal: O "Vidro" */
        .loaderContainer {
          position: fixed;
          inset: 0;
          width: 100vw;
          height: 100vh;
          display: flex;
          flex-direction: column;
          justify-content: center; /* Centraliza verticalmente */
          align-items: center;     /* Centraliza horizontalmente */
          z-index: 2000;          /* Valor alto para garantir que fique por cima de tudo */
          
          /* Fundo semi-transparente ligeiramente mais escuro para contraste */
          background-color: rgba(255, 255, 255, 0.6); 

          /* Efeito Glassmorphism (Vidro Fosco) que você definiu */
          -webkit-backdrop-filter: blur(25px) saturate(180%);
          backdrop-filter: blur(25px) saturate(180%);
          
          /* Transição suave para aparecer/desaparecer (melhora a UX) */
          transition: opacity 0.3s ease-in-out;
        }

        /* 2. Animação do Logo: Pulso Suave */
        .loading-logo {
          animation: pulseCeres 1.8s infinite ease-in-out;
          will-change: transform, opacity;
          margin-bottom: 25px; /* Espaço para o spinner */
        }

        /* 3. Texto do Loading */
        .loading-text {
          margin-top: 20px;
          font-size: 14px;
          color: #111;
          font-weight: 700;
          font-family: system-ui, -apple-system, sans-serif;
          text-transform: uppercase;
          letter-spacing: 1.5px;
          text-align: center;
          
          /* Contorno branco sutil para leitura em qualquer fundo */
          text-shadow: 0 0 10px rgba(255, 255, 255, 0.9);
        }

        /* 4. O Spinner (Círculo Girando) - Simplificado e Centralizado */
        .loader-spinner {
          width: 50px;
          height: 50px;
          border: 4px solid rgba(0, 0, 0, 0.1); /* Círculo de fundo sutil */
          border-left-color: #000;            /* A parte que gira */
          border-radius: 50%;
          animation: rotation 1s linear infinite;
          box-sizing: border-box;
        }

        /* 5. Definição das Animações (Keyframes) */
        
        @keyframes rotation {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @keyframes pulseCeres {
          0% { transform: scale(1); opacity: 0.8; }
          50% { transform: scale(1.04); opacity: 1; }
          100% { transform: scale(1); opacity: 0.8; }
        }
      `}</style>
		</>
	);
};

export default LoadingLogo;
