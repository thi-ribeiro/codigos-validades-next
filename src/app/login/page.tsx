'use client';

import { useAuth } from '@/Contexto/AuthContext';
import { useToast } from '@/Contexto/Toast';
import { useRouter } from 'next/navigation';
import React from 'react';

type Props = {};

export default function page({}: Props) {
	const router = useRouter();
	const { login, logout } = useAuth();
	const { addToast } = useToast();

	const enviarDados = (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		const formData = new FormData(e.currentTarget);
		const usuario = formData.get('usuario') as string;
		const senha = formData.get('senha') as string;

		const loginData = {
			usuario: usuario,
			senha: senha,
			login: true, // Indicador para o backend que é um login
		};
		if (!usuario || !senha) {
			addToast('Por favor, preencha todos os campos!', 'error');
			return;
		}
		const acesso_fetch = process.env.NEXT_PUBLIC_AUTH_API;

		fetch(`${acesso_fetch}/login`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			//credentials: 'include',
			body: JSON.stringify(loginData),
		})
			.then((response) => response.json())
			.then((data) => {
				console.log(data.user);
				login(data.user);
				//alert(data.message);
				addToast(data.message, data.status);

				if (data.status === 'success') {
					router.push('/');
				} else if (data.status === 'error') {
					logout();
				}
			})
			.catch((error) => {
				//console.error('Error:', error);
				//alert('Erro ao realizar login.');

				addToast(error, 'error');
			});
		e.currentTarget.reset(); // Limpa o formulário após o envio
	};

	return (
		<div className='loginPage'>
			<h2>Log In</h2>
			<form onSubmit={enviarDados} className='formLogin'>
				<input type='text' name='usuario' placeholder='Usuário' />
				<input type='password' name='senha' placeholder='Senha' />
				<button type='submit'>Entrar</button>
			</form>
		</div>
	);
}
