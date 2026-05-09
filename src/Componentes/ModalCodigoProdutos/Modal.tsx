'use client';

import { useEffect } from 'react';

interface SimpleModalProps {
	isOpen: boolean;
	onClose: () => void;
	children: React.ReactNode;
}

export default function ModalCodigoProdutos({
	isOpen,
	onClose,
	children,
}: SimpleModalProps) {
	// Supondo que você tenha um estado que controla se o menu/modal aparece

	useEffect(() => {
		if (isOpen) {
			document.body.style.overflow = 'hidden';
		} else {
			document.body.style.overflow = 'unset';
		}

		// Importante: Limpar quando o componente for destruído
		return () => {
			document.body.style.overflow = 'unset';
		};
	}, [isOpen]); // O segredo está aqui: ele só roda quando 'isOpen' mudar

	if (!isOpen) return null;

	return (
		<div className='modal-container'>
			<div className='modal-backdrop' onClick={onClose}></div>
			<div className='modal-content'>
				<button className='modal-close' onClick={onClose}>
					&times;
				</button>
				{children}
			</div>
		</div>
	);
}
