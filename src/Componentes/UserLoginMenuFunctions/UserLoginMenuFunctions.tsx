'use client';

import { useAuth } from '@/Contexto/AuthContext';
import { useRouter } from 'next/navigation';
import React from 'react';
import { IoIosTime, IoMdHome, IoMdPerson } from 'react-icons/io';

export default function UserLoginMenuFunctions() {
	const router = useRouter();
	const { user, isLoading, logout } = useAuth();

	return (
		<header className='header-glass-container'>
			<div className='buscarHeaderUser'>
				<div className='nav-icon-wrapper'>
					<IoMdHome size={24} onClick={() => router.push('/')} />
				</div>

				<div className='userLoginTokenDiv'>
					<div className='userLoginFunctions'>
						{(!isLoading && user?.role === 1) || user?.role === 2 ? (
							<div className='nav-icon-wrapper'>
								<IoIosTime
									size={24}
									onClick={() => router.push('/validades')}
								/>
							</div>
						) : null}
						<div className='nav-icon-wrapper'>
							<IoMdPerson size={24} onClick={() => router.push('/login')} />
						</div>
					</div>
				</div>
			</div>
		</header>
	);
}
