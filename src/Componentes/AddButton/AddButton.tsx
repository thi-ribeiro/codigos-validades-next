import { useAuth } from '@/Contexto/AuthContext';
import React from 'react';
import { IoMdBarcode, IoMdPersonAdd, IoMdQrScanner } from 'react-icons/io';
import { IoAdd, IoDocumentTextOutline, IoTimerOutline } from 'react-icons/io5';

type Props = {
	openFuncion?: () => void;
	openModalAddBarCode?: () => void;
	openModalAddEanPlu?: () => void;
	openModalAddUser?: () => void;
	addUser?: boolean;
	addValidade?: boolean;
	addBarCode?: boolean;
	addCodigo?: boolean;
};

export default function AddButton({
	openFuncion,
	openModalAddBarCode,
	openModalAddEanPlu,
	openModalAddUser,
	addUser = false,
	addBarCode = false,
	addValidade = false,
}: Props) {
	const { user } = useAuth();

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
				openModalAddUser={openModalAddUser}
			/>
		</div>
	);
}

const SelectAddButtonOptions = ({
	role,
	addBarCode,
	addUser,
	addValidade,
	openFuncion,
	openModalAddBarCode,
	openModalAddEanPlu,
	openModalAddUser,
}: any) => {
	// Admin / Gerente
	if (role === 1) {
		return (
			<>
				{addUser && (
					<>
						<div
							className='botoes-adicionais buttonAdd buttonAddUser'
							title='Cadastrar Usuário'
							onClick={openModalAddUser}>
							<IoMdPersonAdd size={20} />
						</div>
						<div
							className='botoes-adicionais buttonAdd buttonAddCodeBar'
							title='Adicionar EAN/PLU'
							onClick={openModalAddEanPlu}>
							<IoMdBarcode size={20} />
						</div>
					</>
				)}

				{addBarCode ? (
					<div
						className='buttonAddValidade buttonAdd'
						onClick={openModalAddBarCode}>
						<IoTimerOutline size={30} />
					</div>
				) : (
					<div className='buttonAdd buttonAddIcon' onClick={openFuncion}>
						<IoAdd size={30} />
					</div>
				)}
			</>
		);
	}

	// Operacional
	if (role === 2 && addValidade) {
		return (
			<div
				className='buttonAddBarCodeScan buttonAdd'
				onClick={openModalAddBarCode}>
				<IoTimerOutline size={30} />
			</div>
		);
	}

	return null;
};
