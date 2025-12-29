'use client';

import React, { useEffect, useState } from 'react';
import { FuncoesProvider, useFuncoes } from '../../Contexto/FuncoesContext';

import { format } from 'date-fns';
import Modal from '@/Componentes/Modal/Modal';
import AutoComplete from '@/Componentes/AutoComplete/AutoComplete';
import { useAuth } from '@/Contexto/AuthContext';
//import { useRouter } from 'next/navigation';

import 'balloon-css';
import { ptBR } from 'date-fns/locale';
import ValidadesProvider, { useValidades } from '@/Contexto/ValidadesContext';
import { ValidadeProduto } from '@/Contexto/ValidadesContext';
import AddButton from '@/Componentes/AddButton/AddButton';

import useModal from '@/Componentes/Modal/useModal';

type Props = {};

export default function page() {
	return (
		<FuncoesProvider>
			<ValidadesProvider>
				<CarregarPagina />
			</ValidadesProvider>
		</FuncoesProvider>
	);
}

const acesso_fetch = process.env.NEXT_PUBLIC_API_URL;
function CarregarPagina({}: Props) {
	const { limitaTexto } = useFuncoes();

	const {
		fetchValidades,
		fetchAddValidade,
		fetchEditarValidade,
		produtosValidades,
		marcasProdutos,
		dataFimIntervalo,
		calcularDiasRestantes,
		ValidadeVerificada,
		ValidadeFinalizada,
		ProdutoEmRebaixa,
		loading,
	} = useValidades();

	const { user, isLoading } = useAuth();

	const {
		isOpen: isOpenAdicionar,
		openModal: openModalAdicionar,
		closeModal: closeModalAdicionar,
	} = useModal();

	const {
		isOpen: isOpenEditar,
		openModal: openModalEditar,
		closeModal: closeModalEditar,
	} = useModal();

	//const router = useRouter();

	const dataAtual = new Date();
	const mesAnoAtual = format(dataAtual, 'MMMM/yyyy', { locale: ptBR });

	const [filtroMarca, setFiltroMarca] = useState<string>('');

	const [FormEditData, setFormEditData] = useState<ValidadeProduto>({
		idvalidades: 0,
		produto: '',
		validade: '',
		responsavel: '',
		data_inserido: '',
		verificado: 0,
		data_verificado: '',
		finalizado: 0,
		data_finalizado: '',
		validadeDiaMes: '',
		marca_produto: '',
		quantidade_produto: '',
		rebaixa: 0,
		data_rebaixa: '',
		tipoquantidade: '',
	});

	useEffect(() => {
		if (!isLoading) {
			// if (!user) {
			// 	router.push('/login');
			// }

			//console.log(dataFimIntervalo);

			if (user?.role !== 1) {
				fetchValidades(user?.empresa);
			} else {
				fetchValidades();
			}
		}
	}, [isLoading]);

	const selecionaMarca = (e: React.FormEvent) => {
		e.preventDefault();
		//console.log(filtroMarca);

		fetchValidades(filtroMarca);

		//const marca = e.currentTarget.children[0].value;
		//setFiltroMarca(marca);
	};

	const definirItemNoArray = (idSelecionado: number, marca: string) => {
		if (idSelecionado) {
			const itemCompletoSelecionado = produtosValidades[marca]?.find(
				(item) => item.idvalidades === idSelecionado
			);

			setFormEditData(itemCompletoSelecionado ?? ({} as ValidadeProduto));
		}
		//setIsModalEditOpen(true);
	};

	const handleChange = (
		e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
	) => {
		//console.log(e.target.value);

		const { name, value, type } = e.target;
		setFormEditData((prevData) => {
			if (type === 'checkbox') {
				const { checked } = e.target as HTMLInputElement;

				return {
					...prevData,
					[name]: Number(checked),
				};
			} else {
				// Lógica para inputs de texto, número, data (como você já tem)
				return {
					...prevData,
					[name]: name === 'quantidade' ? Number(value) : value,
				};
			}
			//return prevData; // Retorna o estado anterior se nenhuma condição for atendida
		});
	};

	return (
		<div className='validadesPage'>
			{isLoading ? (
				<div className='loaderContainer'>
					<div className='loader'></div>
				</div>
			) : (
				<React.Fragment>
					{user?.role === 1 && (
						<div className='filtrarPorMarca'>
							<h2>Filtrar por Marca</h2>
							<form onSubmit={(e) => selecionaMarca(e)}>
								<select
									className='selectFiltroMarca'
									onChange={(e) => setFiltroMarca(e.target.value)}
									value={filtroMarca}>
									<option value=''>Todas as Marcas</option>
									{marcasProdutos.map((marca) => (
										<option
											key={marca.marca_produto}
											value={marca.marca_produto}>
											{marca.marca_produto}
										</option>
									))}
								</select>
								<input type='submit' value='Filtrar' />
							</form>
						</div>
					)}
					{loading ? (
						<div className='loaderContainer'>
							<div className='loader'></div>
						</div>
					) : Object.keys(produtosValidades).length ? (
						<React.Fragment>
							<h2>
								Validades de {mesAnoAtual} até o final de {dataFimIntervalo}
							</h2>
							<div className='tabela-principal'>
								{Object.keys(produtosValidades).map((marca) => (
									<div key={marca} className='grupo-por-marca'>
										<h2 className='divisor-marca'>{marca}</h2>
										<div className='tabela-validades'>
											<div className='linha-header'>
												<div className='coluna-header'>Produto</div>
												<div className='coluna-header'>Validade</div>
												<div className='coluna-header'>Quant.</div>
												<div className='coluna-header'>Restam</div>
												<div className='coluna-header'>Status</div>
											</div>
											<div>
												{produtosValidades[marca]?.map((validade) => (
													<div
														className='linha-dados'
														key={validade.idvalidades}>
														<div
															className='coluna-dados'
															title={validade.produto}>
															{limitaTexto(validade.produto, 10)}
														</div>
														<div className='coluna-dados'>
															{validade.validadeDiaMes.substring(0, 5)}
														</div>
														<div className='coluna-dados'>
															{validade.quantidade_produto}
														</div>
														<div className='coluna-dados'>
															{calcularDiasRestantes(
																validade.validade,
																validade.finalizado
															)}
														</div>
														<div
															className='coluna-dados'
															onClick={() => {
																definirItemNoArray(
																	validade.idvalidades,
																	validade.marca_produto
																);
																openModalEditar();
															}}>
															<ValidadeVerificada
																verificado={validade.verificado}
																dataInserida={validade.data_inserido}
															/>
															<ValidadeFinalizada
																verificado={validade.verificado}
																finalizado={validade.finalizado}
																dataFinalizado={`${validade.data_finalizado} - ${validade.responsavel}`}
															/>
															<ProdutoEmRebaixa
																Rebaixa={validade.rebaixa}
																dataRebaixa={validade.data_rebaixa}
															/>
														</div>
													</div>
												))}
											</div>
										</div>
									</div>
								))}
							</div>
						</React.Fragment>
					) : (
						<h2>Nenhuma validade para {mesAnoAtual}.</h2>
					)}
				</React.Fragment>
			)}

			<Modal isOpen={isOpenAdicionar} onClose={closeModalAdicionar}>
				<form
					className='formularioAdicionarValidade'
					onSubmit={(e) => fetchAddValidade(e, closeModalAdicionar)}>
					<h2>Adicionar Validade</h2>
					<label htmlFor='produto'>Produto:</label>

					<AutoComplete
						nome={true}
						placeholder='Digite o nome do produto'
						nameInput='produto'
						required={true}
					/>
					<label htmlFor='marca'>Marca:</label>
					{user?.empresa ? (
						<input type='text' name='marca' value={user?.empresa} readOnly />
					) : (
						<AutoComplete
							marca={true}
							placeholder='Digite a marca do produto'
							nameInput='marca'
							required={true}
						/>
					)}

					<label htmlFor='validade'>Validade:</label>
					<input type='date' id='validade' name='validade' required />
					<label htmlFor='quantidade'>Quantidade:</label>
					<input type='number' id='quantidade' name='quantidade' required />
					<label htmlFor='tipoquantidade'>Tipo de quantidade:</label>
					<select id='tipoquantidade' name='tipoquantidade' required>
						<option value='cx'>Caixas</option>
						<option value='g'>Gramas</option>
						<option value='l'>Litros</option>
						<option value='ml'>Mililitros</option>
						<option value='pc'>Pacotes</option>
						<option value='kg'>Quilos</option>
						<option value='un'>Unidades</option>
					</select>
					<button type='submit'>Adicionar</button>
					<button type='button' onClick={closeModalAdicionar}>
						Cancelar
					</button>
				</form>
			</Modal>

			<Modal isOpen={isOpenEditar} onClose={closeModalEditar}>
				<form
					className='formularioEditarValidade'
					onSubmit={(e) => fetchEditarValidade(e, closeModalEditar)}>
					<h2>Editar Validade e Status</h2>

					<input
						type='hidden'
						name='id_validade'
						value={FormEditData.idvalidades}
					/>
					<label htmlFor='produto'>Produto:</label>
					<AutoComplete
						nome={true}
						placeholder={FormEditData?.produto}
						valorPadrao={FormEditData?.produto}
						nameInput='produto'
						required={true}
					/>
					<label htmlFor='marca'>Marca:</label>
					<input
						type='text'
						name='marca'
						defaultValue={FormEditData?.marca_produto}
					/>

					<label htmlFor='validade'>Validade:</label>
					<input
						type='date'
						id='validade'
						name='validade'
						required
						value={
							FormEditData?.validade ? FormEditData.validade.split(' ')[0] : ''
						}
						onChange={handleChange}
					/>
					<label htmlFor='quantidade'>
						Quantidade: {FormEditData?.quantidade_produto}
					</label>
					<input
						type='number'
						id='quantidade'
						name='quantidade_produto'
						required
						onChange={handleChange}
						value={Number(FormEditData?.quantidade_produto.replace(/\D/g, ''))}
					/>
					<label htmlFor='tipoquantidade'>Tipo de quantidade:</label>
					<select
						id='tipoquantidade'
						name='tipoquantidade'
						required
						onChange={handleChange}
						value={
							FormEditData?.tipoquantidade ||
							FormEditData?.quantidade_produto.split(' ')[1]
						}>
						<option value='cx'>Caixas</option>
						<option value='g'>Gramas</option>
						<option value='l'>Litros</option>
						<option value='ml'>Mililitros</option>
						<option value='pc'>Pacotes</option>
						<option value='kg'>Quilos</option>
						<option value='un'>Unidades</option>
					</select>
					<div className='statusValidade'>
						<input
							type='checkbox'
							id='statusVerificado'
							name='verificado'
							checked={FormEditData?.verificado ? true : false}
							onChange={handleChange}
						/>

						<label htmlFor='statusVerificado'>Verificado</label>

						<input
							type='checkbox'
							id='statusFinalizado'
							name='finalizado'
							checked={FormEditData?.finalizado ? true : false}
							onChange={handleChange}
						/>
						<label htmlFor='statusFinalizado'>Finalizado</label>

						<input
							type='checkbox'
							id='statusRebaixa'
							name='rebaixa'
							checked={FormEditData?.rebaixa ? true : false}
							onChange={handleChange}
						/>
						<label htmlFor='statusRebaixa'>Rebaixa</label>
					</div>
					<button type='submit'>Salvar</button>
					<button type='button' onClick={closeModalEditar}>
						Cancelar
					</button>
				</form>
			</Modal>

			<AddButton openFuncion={openModalAdicionar} addUser addValidade={true} />
		</div>
	);
}
