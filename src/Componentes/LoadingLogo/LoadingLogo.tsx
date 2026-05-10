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
				{/* Logo com tamanho travado para não dar susto no carregamento */}
				<img
					src='/Ceres1_ncenter.svg'
					alt='Ceres Loading'
					className='loading-logo'
					width={125}
					height={125}
				/>

				<span className='loader'></span>

				{/* Texto direto no container, sem firula de card */}
				{mensagem && <p className='loading-text'>{mensagem}</p>}
			</div>

			<style>{`
                .loaderContainer {
                    position: fixed;
                    inset: 0;
                    width: 100vw;
                    height: 100vh;
                    display: flex;
                    flex-direction: column; /* Um embaixo do outro */
                    justify-content: center;
                    align-items: center;
                    z-index: 1002;
                    background-color: rgba(255, 255, 255, 0.4) !important;
                    
                    /* O vidro fosco que a gente acertou */
                    -webkit-backdrop-filter: blur(20px) saturate(160%) !important;
                    backdrop-filter: blur(20px) saturate(160%) !important;
                }

                .loading-logo {
                    /* Impede que o SVG perca a proporção */
                    height: auto;
                    animation: pulseCeres 1.2s infinite ease-in-out;
                    will-change: transform, opacity;
                }

                .loading-text {
                    margin-top: 20px;
                    font-size: 16px;
                    color: #222;
                    font-weight: 700;
                    font-family: sans-serif;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                    /* Um leve contorno branco no texto ajuda a ler se o fundo for colorido */
                    text-shadow: 0 0 10px rgba(255, 255, 255, 0.8);
                }

 .loader {
  width: 48px;
  height: 48px;
  display: block;
  position: absolute;
  top: 45%;
  left: 45%;
  transform: translate(-50%, -50%);
  border-radius: 50%;
  margin: 15px auto; 
  color: rgba(0, 0, 0, 0.1);
  box-sizing: border-box;
  animation: rotation 2s linear infinite;
}
.loader::after,
.loader::before {
  content: '';  
  box-sizing: border-box;
  position: absolute;
  top: 50%;
  left: 50%;
  background-color: #fff;
  border-radius: 50%;
  border: none;
  //animation: animloader 1s infinite ease-in-out;
}

.loader::after {
  width: 25px;
  height: 25px;
  position: absolute;
  top: 30%;
  left: 40%;
  transform: scale(0.5) translate(0, 15px);
}

.loader::before {
  width: 60px;
  height: 60px;
  top: 40%;
  background-color: #000;
  transform: scale(0.5) translate(-48px, -48px);
}

@keyframes rotation {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
} 
            `}</style>
		</>
	);
};

export default LoadingLogo;
