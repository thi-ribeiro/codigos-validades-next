import { useAuth } from '@/Contexto/AuthContext';
import React from 'react';
import { IoMdPersonAdd } from 'react-icons/io';
import { IoAdd } from 'react-icons/io5';
import useModal from '../Modal/useModal';
import Modal from '../Modal/Modal';
import { useToast } from '@/Contexto/Toast';

type Props = {
	openFuncion: () => void;
	//openFuncionAddUser?: () => void;
	addUser?: boolean;
	addValidade?: boolean;
	addCodigo?: boolean;
};

export default function AddButton({
	openFuncion,
	addUser = false,
	addCodigo = false,
	addValidade = false,
}: Props) {
	const { user } = useAuth();
	const { addToast } = useToast();
	const {
		isOpen: isOpenModalAddUser,
		openModal: openModalAddUser,
		closeModal: closeModalAddUser,
	} = useModal();

	const fetchAddusuario = (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();

		const formData = new FormData(e.currentTarget);
		const usuarioNome = formData.get('usuarioNome') as string;
		const usuarioSenha = formData.get('usuarioSenha') as string;
		const usuarioEmpresa = formData.get('usuarioEmpresa') as string;

		const loginData = {
			usuario: usuarioNome,
			senha: usuarioSenha,
			empresa: usuarioEmpresa,
			cadastro: true, // Indicador para o backend que é um login
		};

		if (!usuarioNome || !usuarioSenha) {
			addToast('Por favor, preencha todos os campos!');
			return;
		}

		const acesso_fetch = process.env.NEXT_PUBLIC_API_URL;

		fetch(`${acesso_fetch}`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			credentials: 'include',
			body: JSON.stringify(loginData),
		})
			.then((response) => response.json())
			.then((data) => {
				addToast(data.message, data.status);
			})
			.catch((error) => {
				console.error('Error:', error);
			});

		if (isOpenModalAddUser) {
			closeModalAddUser();
		}
	};

	return (
		<div className='buttonAddContainer'>
			{addUser && user?.role === 1 && (
				<React.Fragment>
					<div className='buttonAdd buttonAddUser' onClick={openModalAddUser}>
						<IoMdPersonAdd size={15} />
					</div>
					<Modal isOpen={isOpenModalAddUser} onClose={closeModalAddUser}>
						<div className='cadastroProdutos headerGenerico'>
							<h1>Cadastrar Usuário</h1>
							<form
								className='formProdutos'
								onSubmit={(e) => fetchAddusuario(e)}
								method='POST'>
								<input name='usuarioNome' type='text' placeholder='Usuário' />
								<input
									name='usuarioSenha'
									type='password'
									placeholder='Senha'
								/>
								<input
									name='usuarioEmpresa'
									type='text'
									placeholder='Marca / Empresa'
								/>
								<input type='submit' value='Cadastrar' />
							</form>
						</div>
					</Modal>
				</React.Fragment>
			)}

			{user?.role === 1 && (
				<div className='buttonAdd buttonAddIcon' onClick={openFuncion}>
					<IoAdd size={30} />
				</div>
			)}

			{user?.role === 2 && addValidade && (
				<div className='buttonAdd buttonAddIcon' onClick={openFuncion}>
					<IoAdd size={30} />
				</div>
			)}
		</div>
	);
}
