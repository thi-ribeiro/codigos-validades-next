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
	const enviarDados = async (e: React.SubmitEvent<HTMLFormElement>) => {
		e.preventDefault();

		// Salva a referência do formulário LOGO NO INÍCIO
		const formulario = e.currentTarget;

		const formData = new FormData(formulario);
		const usuario = formData.get('usuario') as string;
		const senha = formData.get('senha') as string;

		if (!usuario || !senha) {
			addToast('Por favor, preencha todos os campos!', 'error');
			return;
		}

		const loginData = { usuario, senha, login: true };
		const acesso_fetch = process.env.NEXT_PUBLIC_AUTH_API;

		addToast('Verificando credenciais...', 'info');

		try {
			const response = await fetch(`${acesso_fetch}/login`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(loginData),
			});

			const data = await response.json();

			if (data.status === 'success') {
				await login(data.user);
				addToast(data.message, 'success');

				router.push('/validades');

				// Agora usamos a variável estável, que nunca fica null!
				//formulario.reset();

				window.location.href = '/validades';
			} else {
				logout();
				addToast(data.message, 'error');
			}
		} catch (error) {
			logout();
			addToast(
				'Erro ao conectar ao servidor. Tente novamente mais tarde.',
				'error',
			);
			console.error(error);
		}
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
