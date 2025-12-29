'use client';

import { useAuth } from '@/Contexto/AuthContext';
import { useRouter } from 'next/navigation';
import React from 'react';
import { IoIosTime, IoMdHome, IoMdPerson } from 'react-icons/io';
type Props = {};

export default function UserLoginMenuFunctions({}: Props) {
	const router = useRouter();
	const { user, isLoading, logout } = useAuth();

	return (
		<div className='buscarHeaderUser'>
			<div className='buscarHeaderUserIcon'>
				<IoMdHome size={25} onClick={() => router.push('/')} />
			</div>
			<div className='userLoginTokenDiv'>
				<div className='userLoginFunctions'>
					{(!isLoading && user?.role === 1) || user?.role === 2 ? (
						<React.Fragment>
							<IoIosTime size={25} onClick={() => router.push('/validades')} />
						</React.Fragment>
					) : null}
					<IoMdPerson
						size={25}
						onClick={() => {
							//logout();
							router.push('/login');
						}}
					/>
				</div>
			</div>
		</div>
	);
}
