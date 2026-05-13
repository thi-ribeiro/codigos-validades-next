'use client';

import { useValidades } from '@/Contexto/ValidadesContext';
import { IoCloseOutline } from 'react-icons/io5'; // Adicionei um ícone de scan
import { useAuth } from '@/Contexto/AuthContext';
import useModal from '../Modal/useModal';
import React from 'react';
import ModalCeres from '../ModalCeres/ModalCeres';
import { MdOutlineQrCodeScanner } from 'react-icons/md';

export default function BarraBusca() {
	const { setNomeProduto, nomeProduto } = useValidades();
	const { user } = useAuth();

	const {
		isOpen: isOpenModalScanner,
		closeModal: fecharModalScanner,
		openModal: openModal,
	} = useModal();

	if (!user?.usuario) return null;

	// A lógica de extração que você definiu
	const tratarLeitura = (decodedText: string) => {
		if (decodedText.includes(':p:')) {
			navigator.vibrate(200);

			const partes = decodedText.split(':');
			const pluExtraido = partes[2];

			if (pluExtraido) {
				setNomeProduto(pluExtraido.trim());
				fecharModalScanner();
			}
		} else {
			setNomeProduto(decodedText.trim());
			fecharModalScanner();
		}
	};

	return (
		<React.Fragment>
			<div className='search-container'>
				<input
					type='text'
					placeholder='Filtrar por PLU / Nome...'
					value={nomeProduto}
					onChange={(e) => setNomeProduto(e.target.value)}
				/>

				<button
					onClick={openModal}
					title='Escanear etiqueta'
					className='btn-scanner'>
					<MdOutlineQrCodeScanner size={20} color='#000' />
				</button>

				<button name='oksearch' onClick={() => setNomeProduto('')}>
					<IoCloseOutline size={25} />
				</button>
			</div>

			<ModalCeres
				isOpen={isOpenModalScanner}
				onClose={fecharModalScanner}
				onResult={tratarLeitura}
			/>
		</React.Fragment>
	);
}
