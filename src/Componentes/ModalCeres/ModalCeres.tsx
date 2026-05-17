'use client';

import React, { useEffect, useRef } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';

interface ModalCeresProps {
	isOpen: boolean;
	onClose: () => void;
	onResult: (text: string) => void;
	id?: string;
}

export default function ModalCeres({
	isOpen,
	onClose,
	onResult,
	id = 'ceres-integrated-scanner',
}: ModalCeresProps) {
	const scannerRef = useRef<Html5Qrcode | null>(null);
	const regionId = id;

	// LIMPADOR UNITÁRIO (SÓ NO FECHAMENTO): Para os tracks do vídeo que está na tela
	const limparTracksDoVideoLocal = () => {
		if (typeof window !== 'undefined') {
			const videoElement = document.querySelector(
				`#${regionId} video`,
			) as HTMLVideoElement;
			if (videoElement && videoElement.srcObject) {
				const stream = videoElement.srcObject as MediaStream;
				stream.getTracks().forEach((track) => track.stop());
				videoElement.srcObject = null;
				console.log('[Ceres] Tracks de vídeo locais interrompidos.');
			}
		}
	};

	const encerrarHardware = async () => {
		if (scannerRef.current) {
			try {
				if (scannerRef.current.isScanning) {
					await scannerRef.current.stop();
				}
				scannerRef.current.clear();
			} catch (err) {
				console.warn(
					'Erro ao limpar via lib, forçando desligamento dos tracks locais...',
				);
				limparTracksDoVideoLocal();
			} finally {
				scannerRef.current = null;
			}
		} else {
			limparTracksDoVideoLocal();
		}
	};

	useEffect(() => {
		if (isOpen) {
			document.body.style.overflow = 'hidden';

			// Criamos a instância normalmente
			const html5QrCode = new Html5Qrcode(regionId, {
				formatsToSupport: [
					Html5QrcodeSupportedFormats.CODE_128,
					Html5QrcodeSupportedFormats.EAN_13,
					Html5QrcodeSupportedFormats.EAN_8,
					Html5QrcodeSupportedFormats.QR_CODE,
				],
				verbose: false,
			});

			scannerRef.current = html5QrCode;

			// Inicia direto sem disputar o hardware com ninguém antes
			html5QrCode
				.start(
					{ facingMode: 'environment' },
					{
						fps: 30,
						qrbox: { width: 280, height: 100 },
						aspectRatio: 1.0,
						videoConstraints: {
							facingMode: 'environment',
							focusMode: 'continuous',
							whiteBalanceMode: 'continuous',
							width: { ideal: 1280 },
							height: { ideal: 720 },
						} as any,
					},
					(text) => {
						onResult(text);
						handleFechar();
					},
					() => {},
				)
				.catch((err) => console.error('Erro na câmera:', err));
		} else {
			document.body.style.overflow = 'unset';
			return;
		}

		return () => {
			document.body.style.overflow = 'unset';
			// Quando desmontar (fechar o modal correndo), limpa o elemento local
			limparTracksDoVideoLocal();
		};
	}, [isOpen]);

	const handleFechar = async () => {
		await encerrarHardware();
		onClose();
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
