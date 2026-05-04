'use client';

import { useValidades } from '@/Contexto/ValidadesContext';
import { IoCloseOutline } from 'react-icons/io5';
import { useAuth } from '@/Contexto/AuthContext';

export default function BarraBusca() {
	const { setNomeProduto, nomeProduto } = useValidades();
	const { user } = useAuth();

	if (!user?.usuario) return;

	return (
		<div className='search-container'>
			<input
				type='text'
				placeholder='Buscar por nome do produto...'
				value={nomeProduto}
				onChange={(e) => setNomeProduto(e.target.value)}
			/>
			<button name='oksearch' onClick={() => setNomeProduto('')}>
				<IoCloseOutline size={25} />
			</button>
		</div>
	);
}
