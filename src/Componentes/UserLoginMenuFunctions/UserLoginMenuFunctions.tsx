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
					<span>Home</span>
				</div>

				<div className='userLoginTokenDiv'>
					<div className='userLoginFunctions'>
						{/* Validades */}

						<div
							className='nav-icon-wrapper'
							onClick={() => navigate('/validades')}>
							<IoIosTime
								size={24}
								className={
									pathname.startsWith('/validades') ? 'active-icon' : ''
								}
							/>
							<span>Validades</span>
						</div>

						{/* Ícone de Perfil/Logout */}
						<div className='nav-icon-wrapper'>
							{user || isLoading ? (
								<div
									style={{
										display: 'flex',
										flexDirection: 'column',
										alignItems: 'center',
									}}
									onClick={async () => {
										if (confirm('Efetuar logout??')) await logout();
									}}>
									<IoMdLogOut size={24} />
									<span>Sair</span>
								</div>
							) : (
								<div
									style={{
										display: 'flex',
										flexDirection: 'column',
										alignItems: 'center',
									}}
									onClick={() => navigate('/login')}>
									<IoMdPerson
										size={24}
										className={pathname === '/login' ? 'active-icon' : ''}
									/>
									<span>Entrar</span>
								</div>
							)}
						</div>
					</div>
				</div>
			</div>
		</header>
	);
}
