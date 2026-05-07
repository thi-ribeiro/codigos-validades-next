'use client';

import React, { useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

interface ScannerCeresProps {
	onResult: (decodedText: string) => void;
	onClose: () => void;
}

export default function ScannerCeres({ onResult, onClose }: ScannerCeresProps) {
	const scannerRef = useRef<Html5Qrcode | null>(null);
	const divRef = useRef<HTMLDivElement>(null);
	const regionId = 'ceres-scanner-region';

	useEffect(() => {
		let isMounted = true;
		let html5QrCode: Html5Qrcode | null = null;

		const startScanner = async () => {
			if (!divRef.current) return;

			// Criamos a instância
			html5QrCode = new Html5Qrcode(divRef.current.id);
			scannerRef.current = html5QrCode;

			try {
				await html5QrCode.start(
					{ facingMode: 'environment' },
					{
						fps: 20,
						qrbox: { width: 280, height: 150 },
						aspectRatio: 1.0,
					},
					(text) => {
						if (isMounted) onResult(text);
					},
					() => {},
				);
			} catch (err) {
				console.error('Erro ao iniciar:', err);
			}
		};

		startScanner();

		// CLEANUP REFORÇADO: O SEGREDO ESTÁ AQUI
		return () => {
			isMounted = false;

			if (html5QrCode) {
				// Verificamos se ele realmente está escaneando antes de tentar parar
				if (html5QrCode.isScanning) {
					html5QrCode
						.stop()
						.then(() => {
							html5QrCode?.clear();
							console.log('Hardware da câmera liberado!');
						})
						.catch((err) => {
							console.warn('Falha ao liberar câmera:', err);
							// Tentativa de limpeza bruta se o stop falhar
							html5QrCode?.clear();
						});
				} else {
					html5QrCode.clear();
				}
			}
		};
	}, [onResult]);

	const finalizarGeral = async () => {
		if (scannerRef.current) {
			try {
				// 1. Manda o hardware parar (isso apaga a bolinha verde)
				if (scannerRef.current.isScanning) {
					await scannerRef.current.stop();
				}
				// 2. Limpa o lixo de HTML que a biblioteca criou
				scannerRef.current.clear();

				console.log('Ceres: Câmera encerrada e hardware liberado.');
			} catch (err) {
				console.warn('Erro ao finalizar:', err);
				// Se o stop falhar, forçamos o clear de qualquer jeito
				scannerRef.current.clear();
			} finally {
				scannerRef.current = null;
			}
		}
	};

	return (
		<div
			ref={divRef}
			id={regionId}
			// A KEY força o React a tratar isso como um elemento único e intocável
			key={regionId}
			style={{
				width: '100%',
				height: '300px',
				backgroundColor: '#000',
				borderRadius: '8px',
				overflow: 'hidden',
				position: 'relative',
			}}
		/>
	);
}
