'use client';

import React, { useEffect, useState } from 'react';
import { ValidadeProduto } from '@/Contexto/ValidadesContext';
import { IoBarcodeOutline } from 'react-icons/io5';
import AutoComplete from '../AutoComplete/AutoComplete';
import { useAuth } from '@/Contexto/AuthContext';
import { useToast } from '@/Contexto/Toast';

// Hook para animação de loading mantido conforme sua implementação
const useLoadingDots = (isLoading: boolean) => {
	const [dots, setDots] = useState('');

	useEffect(() => {
		if (!isLoading) {
			setDots('');
			return;
		}

		const i = setInterval(() => {
			setDots((d) => (d.length < 3 ? d + '.' : ''));
		}, 400);

		return () => clearInterval(i);
	}, [isLoading]);

	return dots;
};

interface SimpleModalProps {
	isOpen: boolean;
	onClose: () => void;
	dadosIniciais?: ValidadeProduto | null;
	onScan: () => void;
	fetchScan?: (code: number) => void;
	tipoModal: 'novo' | 'editar' | 'eanplu' | 'add_codigo' | 'usuario';
	onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
	onDelete?: (id: number) => void;
	loadingScanner: boolean;
	loadingButtons: boolean;
	usuario?: Record<string, string>;
}

export default function Modal({
	isOpen,
	onClose,
	dadosIniciais,
	fetchScan,
	onDelete,
	onScan,
	onSubmit,
	loadingScanner,
	loadingButtons,
	tipoModal,
}: SimpleModalProps) {
	const dots = useLoadingDots(loadingScanner);
	const [formEditData, setFormEditData] = useState<Partial<ValidadeProduto>>(
		{},
	);
	const { user } = useAuth();
	const { addToast } = useToast();

	// Controle de bloqueio de scroll e reset de dados
	useEffect(() => {
		if (isOpen) {
			setFormEditData(
				dadosIniciais || {
					produto: '',
					marca_produto: '',
					quantidade_produto: '',
				},
			);
			document.body.style.overflow = 'hidden';
		} else {
			document.body.style.overflow = 'unset';
		}

		return () => {
			document.body.style.overflow = 'unset';
		};
	}, [isOpen, dadosIniciais]);

	const handleChange = (
		e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
	) => {
		const { name, value, type } = e.target;
		let finalValue: any = value;

		if (type === 'checkbox') {
			finalValue = Number((e.target as HTMLInputElement).checked);
		}

		setFormEditData((prev) => ({
			...prev,
			[name]: finalValue,
		}));
	};

	if (!isOpen) return null;

	const titulos = {
		eanplu: 'Adicionar Código EAN / PLU',
		add_codigo: 'Adicionar nova validade',
		novo: 'Novo Produto',
		editar: 'Editar Produto',
		usuario: 'Novo Usuário',
	};

	// Flags de controle para facilitar a renderização condicional
	const isEanPlu = tipoModal === 'eanplu';
	const isEdit = tipoModal === 'editar';
	const isUsuario = tipoModal === 'usuario';

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
			console.log('Por favor, preencha todos os campos!');
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

		onClose();
	};

	const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
		const valor = e.target.value;
		// Só dispara se o campo não estiver vazio e for diferente do que já estava lá
		if (valor && valor !== dadosIniciais?.codigoProduto) {
			fetchScan?.(Number(valor));
		}
	};

	return (
		<div className='modal-container'>
			<div className='modal-backdrop' onClick={onClose}></div>

			<div className='modal-content'>
				<div className='modal-header-close'>
					<button className='modal-close' onClick={onClose} type='button'>
						&times;
					</button>
				</div>

				{isUsuario ? (
					<form
						className='formularioAdicionarValidade'
						onSubmit={fetchAddusuario}
						method='POST'>
						<h2>Cadastrar Usuário</h2>
						<input
							name='usuarioNome'
							type='text'
							placeholder='Usuário'
							required
						/>
						<input
							name='usuarioSenha'
							type='password'
							placeholder='Senha'
							required
						/>
						<input
							name='usuarioEmpresa'
							type='text'
							placeholder='Marca / Empresa'
						/>
						<div className='buttonSubmCanc'>
							<input
								type='submit'
								value={loadingButtons ? 'Cadastrando...' : 'Cadastrar'}
								disabled={loadingButtons}
							/>
							<input type='button' value='Cancelar' onClick={onClose} />
						</div>
					</form>
				) : (
					<form className='formularioAdicionarValidade' onSubmit={onSubmit}>
						<h2>{titulos[tipoModal] || 'Produto'}</h2>

						<input
							type='hidden'
							name='id_validade'
							value={formEditData?.idvalidades || ''}
						/>
						<input
							type='hidden'
							name='idRelacionado'
							value={formEditData?.idRelacionado || ''}
						/>
						{/* SEÇÃO 1: SEMPRE VISÍVEL (Código, Nome, Marca) */}
						<label htmlFor='codigoProduto'>Código de Barras:</label>
						<div className='add_scan_codigo_barras'>
							<input
								id='codigoProduto'
								name='codigoProduto'
								type='text'
								inputMode='numeric'
								value={formEditData?.codigoProduto || ''}
								onChange={(e) => handleChange(e)}
								onBlur={handleBlur}
								maxLength={13}
								placeholder='Código de Barras'
								required
								autoComplete='off'
								readOnly={isEdit}
							/>
							{isEdit ? null : (
								<div className='nav-icon-scanner'>
									<IoBarcodeOutline size={30} onClick={() => onScan()} />
								</div>
							)}
						</div>

						<label htmlFor='codigoInterno'>Código interno:</label>
						<input
							id='codigoInterno'
							name='codigoInterno'
							type='text'
							inputMode='numeric'
							value={formEditData?.codigoInterno || ''}
							onChange={handleChange}
							required
							maxLength={5}
							placeholder={
								loadingScanner ? `Carregando ${dots}` : 'Código interno.'
							}
							autoComplete='off'
							readOnly={isEdit}
						/>

						<label htmlFor='produto'>Produto:</label>
						<AutoComplete
							nome={true}
							valorPadrao={formEditData?.produto || ''}
							placeholder={
								loadingScanner ? `Carregando ${dots}` : 'Nome do produto.'
							}
							nameInput='produto'
							required={true}
							readOnly={isEdit}
						/>

						<label htmlFor='marca'>Marca:</label>
						{user?.empresa ? (
							<input type='text' name='marca' value={user?.empresa} readOnly />
						) : (
							<AutoComplete
								marca={true}
								valorPadrao={formEditData?.marca_produto || ''}
								placeholder={
									loadingScanner ? `Carregando ${dots}` : 'Digite a marca.'
								}
								nameInput='marca'
								required={false}
								eanplu={true}
								readOnly={isEdit}
							/>
						)}

						{/* SEÇÃO 2: CAMPOS ESPECÍFICOS DE VALIDADE (Escondidos se for eanplu) */}
						{!isEanPlu && (
							<>
								<label htmlFor='validade'>Validade:</label>
								<input
									type='date'
									id='validade'
									name='validade'
									required
									value={formEditData?.validade?.split('T')[0] || ''}
									onChange={handleChange}
								/>

								<label htmlFor='quantidade_produto'>Quantidade:</label>
								<input
									type='number'
									id='quantidade_produto'
									name='quantidade_produto'
									required
									onChange={handleChange}
									placeholder='Quantidade de produtos...'
									value={
										formEditData?.quantidade_produto
											?.toString()
											.replace(/\D/g, '') || ''
									}
								/>

								<label htmlFor='tipoquantidade'>Tipo de quantidade:</label>
								<select
									id='tipoquantidade'
									name='tipoquantidade'
									required
									onChange={handleChange}
									value={
										formEditData?.tipoquantidade ||
										formEditData?.quantidade_produto?.split(' ')[1]
									}>
									<option value='cx'>Caixas</option>
									<option value='g'>Gramas</option>
									<option value='l'>Litros</option>
									<option value='ml'>Mililitros</option>
									<option value='pc'>Pacotes</option>
									<option value='kg'>Quilos</option>
									<option value='un'>Unidades</option>
								</select>

								{/* Status só aparecem no modo Editar */}
								{isEdit && (
									<div className='statusValidade'>
										<input
											type='checkbox'
											id='statusVerificado'
											name='verificado'
											checked={!!formEditData?.verificado}
											onChange={handleChange}
										/>
										<label htmlFor='statusVerificado'>Verificado</label>

										<input
											type='checkbox'
											id='statusFinalizado'
											name='finalizado'
											checked={!!formEditData?.finalizado}
											onChange={handleChange}
										/>
										<label htmlFor='statusFinalizado'>Finalizado</label>

										<input
											type='checkbox'
											id='statusRebaixa'
											name='rebaixa'
											checked={!!formEditData?.rebaixa}
											onChange={handleChange}
										/>
										<label htmlFor='statusRebaixa'>Rebaixa</label>
									</div>
								)}
							</>
						)}

						{/* SEÇÃO 3: BOTÕES DINÂMICOS */}
						<div className='functionsButons'>
							<div className='buttonSubmCanc'>
								{isEdit ? (
									formEditData?.responsavel === user?.usuario ||
									user?.role === 1 ? (
										<>
											<button
												type='button'
												disabled={loadingButtons}
												style={{ backgroundColor: '#d32f2f', color: 'white' }}
												onClick={() =>
													onDelete?.(Number(formEditData?.idvalidades))
												}>
												{loadingButtons ? 'Aguarde...' : 'Remover'}
											</button>

											<button
												type='submit'
												disabled={loadingButtons}
												style={{
													backgroundColor: loadingButtons
														? '#d32f2f'
														: '#4CAF50',
													color: 'white',
												}}>
												{loadingButtons ? 'Processando...' : 'Atualizar'}
											</button>
										</>
									) : null
								) : (
									// BOTAO MODO ADICIONAR / EANPLU
									<button
										type='submit'
										disabled={loadingButtons}
										style={{
											backgroundColor: loadingButtons ? '#d32f2f' : '#4CAF50',
											color: 'white',
										}}>
										{loadingButtons
											? 'Processando...'
											: isEanPlu
												? 'Salvar EAN/PLU'
												: 'Adicionar'}
									</button>
								)}

								<button type='button' onClick={onClose}>
									Cancelar
								</button>
							</div>
						</div>
					</form>
				)}
			</div>
		</div>
	);
}
