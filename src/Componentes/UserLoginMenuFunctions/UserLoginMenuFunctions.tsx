'use client';

import React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/Contexto/AuthContext';
import { IoIosTime, IoMdHome, IoMdPerson, IoMdLogOut } from 'react-icons/io';

export default function UserLoginMenuFunctions() {
	const router = useRouter();
	const pathname = usePathname();
	const { user, isLoading, logout } = useAuth();

	// Função para evitar navegação redundante
	const navigate = (path: string) => {
		if (pathname !== path) {
			router.push(path);
		}
	};

	return (
		<header className='header-glass-container'>
			<div className='buscarHeaderUser'>
				{/* Home: Sempre visível */}
				<div className='nav-icon-wrapper'>
					<IoMdHome
						size={24}
						onClick={() => navigate('/')}
						className={pathname === '/' ? 'active-icon' : ''}
					/>
				</div>

				<div className='userLoginTokenDiv'>
					<div className='userLoginFunctions'>
						{/* Validades: Só aparece para Admin (1) ou Operador (2) */}
						{!isLoading && user && (
							<div className='nav-icon-wrapper'>
								<IoIosTime
									size={24}
									onClick={() => navigate('/validades')}
									className={
										pathname.startsWith('/validades') ? 'active-icon' : ''
									}
								/>
							</div>
						)}

						{/* Ícone de Perfil/Login Dinâmico */}
						<div className='nav-icon-wrapper'>
							{user ? (
								// Se estiver logado, o ícone pode deslogar ou ir para perfil
								<IoMdLogOut
									size={24}
									onClick={() => {
										if (confirm('Efetuar logout??')) logout();
									}}
									title='Sair'
								/>
							) : (
								// Se deslogado, leva para o login
								<IoMdPerson
									size={24}
									onClick={() => navigate('/login')}
									className={pathname === '/login' ? 'active-icon' : ''}
								/>
							)}
						</div>
					</div>
				</div>
			</div>
		</header>
	);
}
