import { useAuth } from '@/Contexto/AuthContext';
import React from 'react';
import { IoMdBarcode, IoMdPersonAdd, IoMdQrScanner } from 'react-icons/io';
import { IoAdd, IoDocumentTextOutline } from 'react-icons/io5';
import useModal from '../Modal/useModal';
import Modal from '../Modal/Modal';
import { useToast } from '@/Contexto/Toast';
import { add } from 'lodash';

type Props = {
	openFuncion: () => void;
	openModalAddBarCode?: () => void;
	openModalAddEanPlu?: () => void;
	//openFuncionAddUser?: () => void;
	addUser?: boolean;
	addValidade?: boolean;
	addBarCode?: boolean;
	addCodigo?: boolean;
};

export default function AddButton({
	openFuncion,
	openModalAddBarCode,
	openModalAddEanPlu,
	addUser = false,
	addBarCode = false,
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

		fetch('/api/usuarios', {
			// O Next.js já sabe que é no seu próprio servidor
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
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
			<SelectAddButtonOptions
				role={user?.role}
				addBarCode={addBarCode}
				addUser={addUser}
				addValidade={addValidade}
				openFuncion={openFuncion}
				openModalAddBarCode={openModalAddBarCode}
				openModalAddEanPlu={openModalAddEanPlu}
				isOpenModalAddUser={isOpenModalAddUser}
				openModalAddUser={openModalAddUser}
				closeModalAddUser={closeModalAddUser}
				fetchAddusuario={fetchAddusuario}
			/>
		</div>
	);
}

// Transformamos em um componente funcional (sem async!)
const SelectAddButtonOptions = ({
	role,
	addBarCode,
	addUser,
	addValidade,
	openFuncion,
	openModalAddBarCode,
	openModalAddEanPlu,
	isOpenModalAddUser,
	openModalAddUser,
	closeModalAddUser,
	fetchAddusuario,
}: any) => {
	// Recomendo criar uma interface para esses tipos depois

	// Caso para Role 1 (Admin/Gerente)
	if (role === 1) {
		return (
			<>
				{addUser && (
					<>
						<div
							className='botoes-adicionais buttonAdd buttonAddUser'
							onClick={openModalAddUser}>
							<IoMdPersonAdd size={15} />
						</div>
						<div
							className='botoes-adicionais buttonAdd buttonAddCodeBar'
							onClick={openModalAddEanPlu}>
							<IoMdBarcode size={15} />
						</div>
					</>
				)}

				{addBarCode ? (
					<div
						className='buttonAddValidade buttonAdd'
						onClick={openModalAddBarCode}>
						<IoDocumentTextOutline size={20} />
					</div>
				) : (
					<div className='buttonAdd buttonAddIcon' onClick={openFuncion}>
						<IoAdd size={30} />
					</div>
				)}

				<Modal isOpen={isOpenModalAddUser} onClose={closeModalAddUser}>
					<div className='cadastroProdutos headerGenerico'>
						<h1>Cadastrar Usuário</h1>
						<form
							className='formProdutos'
							onSubmit={fetchAddusuario}
							method='POST'>
							<input name='usuarioNome' type='text' placeholder='Usuário' />
							<input name='usuarioSenha' type='password' placeholder='Senha' />
							<input
								name='usuarioEmpresa'
								type='text'
								placeholder='Marca / Empresa'
							/>
							<input type='submit' value='Cadastrar' />
						</form>
					</div>
				</Modal>
			</>
		);
	}

	// Caso para Role 2 (Operacional/Validade)
	if (role === 2 && addValidade) {
		return (
			<div
				className='buttonAddBarCodeScan buttonAdd'
				onClick={openModalAddBarCode}>
				<IoMdQrScanner size={20} />
			</div>
		);
	}

	return null; // Caso não caia em nenhuma regra
};
