'use client';

import React, { useEffect, useRef } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';

interface ModalCeresProps {
	isOpen: boolean;
	onClose: () => void;
	onResult: (text: string) => void;
	id?: string; // ID opcional
}

export default function ModalCeres({
	isOpen,
	onClose,
	onResult,
	id = 'ceres-integrated-scanner',
}: ModalCeresProps) {
	const scannerRef = useRef<Html5Qrcode | null>(null);
	const regionId = id;

	// Função interna para garantir que o hardware pare antes de qualquer coisa
	const encerrarHardware = async () => {
		if (scannerRef.current) {
			try {
				// Verifica se ainda está escaneando antes de tentar parar
				if (scannerRef.current.isScanning) {
					await scannerRef.current.stop();
				}
				// O clear() é quem costuma dar o erro de 'removeChild'
				// Vamos garantir que ele só rode se o scanner ainda existir
				scannerRef.current.clear();
			} catch (err) {
				// Silenciamos o erro de DOM, pois o componente já está sendo desmontado
				console.warn('Hardware liberado com aviso de DOM (normal no React)');
			} finally {
				scannerRef.current = null;
			}
		}
	};

	useEffect(() => {
		if (isOpen) {
			// Trava o scroll do body
			document.body.style.overflow = 'hidden';

			// O SEGREDO: Os formatos entram aqui no segundo parâmetro do construtor
			const html5QrCode = new Html5Qrcode(regionId, {
				formatsToSupport: [
					Html5QrcodeSupportedFormats.EAN_13,
					Html5QrcodeSupportedFormats.EAN_8,
					Html5QrcodeSupportedFormats.QR_CODE,
				],
				verbose: false, // Opcional: silencia logs desnecessários no console
			});

			scannerRef.current = html5QrCode;

			html5QrCode
				.start(
					{ facingMode: 'environment' },
					{
						fps: 30,
						qrbox: { width: 280, height: 150 },
						aspectRatio: 1.0,
					},
					(text) => {
						onResult(text);
						// Opcional: fechar automaticamente após sucesso
						handleFechar();
					},
					() => {},
				)
				.catch((err) => console.error('Erro na câmera:', err));
		} else {
			document.body.style.overflow = 'unset';
		}

		return () => {
			document.body.style.overflow = 'unset';
			encerrarHardware(); // Garante a limpeza se o componente for destruído
		};
	}, [isOpen]);

	const handleFechar = async () => {
		await encerrarHardware(); // Para a câmera PRIMEIRO
		onClose(); // Fecha o modal DEPOIS
	};

	if (!isOpen) return null;

	return (
		<div className='modal-container' style={{ zIndex: 9999 }}>
			<div className='modal-backdrop' onClick={handleFechar}></div>
			<div className='modal-content' style={{ position: 'relative' }}>
				<button
					className='modal-close'
					onClick={handleFechar}
					style={{
						position: 'absolute',
						right: '10px',
						top: '10px',
						zIndex: 10,
					}}>
					&times;
				</button>

				<h2 style={{ textAlign: 'center', marginBottom: '15px' }}>
					Escanear Código
				</h2>

				{/* O Scanner agora é parte nativa do Modal */}
				<div
					id={regionId}
					style={{
						width: '100%',
						minHeight: '300px',
						backgroundColor: '#000',
						borderRadius: '8px',
						overflow: 'hidden',
					}}
				/>

				<p
					style={{
						textAlign: 'center',
						fontSize: '12px',
						marginTop: '10px',
						color: '#666',
					}}>
					Aponte para o código de barras da etiqueta
				</p>
			</div>
		</div>
	);
}
