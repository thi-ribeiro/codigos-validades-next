'use client';

import React, { useState } from 'react';
import _ from 'lodash';
import { IoRemoveCircleOutline } from 'react-icons/io5';
import { useAuth } from '@/Contexto/AuthContext';
import { FuncoesProvider, useFuncoes } from '@/Contexto/FuncoesContext';
import Modal from '@/Componentes/Modal/Modal';
import AutoComplete from '@/Componentes/AutoComplete/AutoComplete';
import AddButton from '@/Componentes/AddButton/AddButton';

import { useModal } from '@/Componentes/Modal/useModal';
import { IoIosSwap } from 'react-icons/io';

export interface Props {}

export default function page() {
	return (
		<FuncoesProvider>
			<Pagina />
		</FuncoesProvider>
	);
}

function Pagina({}: Props) {
	const { user } = useAuth();
	const {
		fetchProds,
		deletarProduto,
		produto,
		loading,
		buscar,
		setBuscar,
		cadastroCodigo,
		editarCodigo,
		leftZeros,
		qntCodigosMarca,
		TotalRegistros,
	} = useFuncoes();

	const {
		isOpen: isOpenModalAdd,
		openModal: openModalAdd,
		closeModal: closeModalAdd,
	} = useModal();

	const {
		isOpen: isOpenModalRemove,
		openModal: openModalRemove,
		closeModal: closeModalRemove,
	} = useModal();

	const {
		isOpen: isOpenModalEdit,
		openModal: openModalEdit,
		closeModal: closeModalEdit,
	} = useModal();

	interface ProdutoDetails {
		id: number;
		produto: string;
		marca: string;
		codigo?: number;
	}

	const [produtoSelected, setprodutoSelected] = useState<ProdutoDetails>({
		id: 0,
		produto: '',
		marca: '',
		codigo: 0,
	});

	const deletarModal = (id: number, produto: string, marca: string) => {
		setprodutoSelected({ id: id, produto: produto, marca: marca });
		openModalRemove();
	};

	const editarModal = (
		id: number,
		produto: string,
		marca: string,
		codigo: number
	) => {
		setprodutoSelected({
			id: id,
			produto: produto,
			marca: marca,
			codigo: codigo,
		});
		openModalEdit();
	};

	return (
		<React.Fragment>
			<div className='buscarHeader'>
				<h1>Consulta de Produtos</h1>
				<form
					className='formBuscarProdutos'
					onSubmit={(e) => fetchProds(e, buscar)}>
					<input
						type='text'
						placeholder='Buscar	por Produto ou Marca'
						onChange={(e) => setBuscar(e.target.value)}
					/>
					<input type='submit' value='Buscar Produto' />
					{TotalRegistros !== 0 ? (
						<div className='totalRegistros'>
							Total listado:
							<span className='qntCodigosSpan'>
								&nbsp; {TotalRegistros}
								&nbsp; código(s)
							</span>
						</div>
					) : null}
				</form>
			</div>

			{loading && (
				<div className='loaderContainer'>
					<div className='loader'></div>
				</div>
			)}

			<div className='produtosBusca'>
				{produto &&
					Object.keys(produto).map((marca, id) => {
						return (
							<div key={id} className='produtosItemsMarca'>
								<div className='marcaDiv'>
									<h2>{marca ? marca : 'Verificar marca'}</h2>
									<span className='qntCodigosSpan'>
										{qntCodigosMarca[marca]}
										&nbsp;Código(s)
									</span>
								</div>
								{produto[marca].map((produto, index) => {
									return (
										<div key={index} className='produtosItems'>
											<div>{produto.nome_produto}</div>
											{user?.role === 1 && (
												<React.Fragment>
													<IoIosSwap
														size={16}
														onClick={() =>
															editarModal(
																produto.idcodigo,
																produto.nome_produto,
																produto.marca_produto,
																produto.codigo_produto
															)
														}
													/>
													<IoRemoveCircleOutline
														size={16}
														onClick={() =>
															deletarModal(
																produto.idcodigo,
																produto.nome_produto,
																produto.marca_produto
															)
														}
													/>
												</React.Fragment>
											)}
											<div>{leftZeros(produto.codigo_produto)}</div>
										</div>
									);
								})}
							</div>
						);
					})}
			</div>

			<AddButton openFuncion={openModalAdd} addCodigo={true} />

			<Modal isOpen={isOpenModalAdd} onClose={closeModalAdd}>
				<div className='cadastroProdutos headerGenerico'>
					<h1>Cadastrar Produto</h1>
					<form
						className='formProdutos'
						onSubmit={(e) => cadastroCodigo(e, closeModalAdd)}
						method='POST'>
						<AutoComplete
							nameInput='nomeProduto'
							placeholder='Nome do Produto'
							nome={true}
						/>
						<AutoComplete
							nameInput='marcaProduto'
							placeholder='Marca do Produto'
							marca={true}
						/>

						<input
							name='codigoProduto'
							type='text'
							placeholder='Código do Produto'
						/>
						<input type='submit' value='Cadastrar Produto' disabled={loading} />
					</form>
				</div>
			</Modal>

			<Modal isOpen={isOpenModalRemove} onClose={closeModalRemove}>
				<div className='removerCodigoProdutos headerGenerico'>
					<h1>Deletar produto</h1>
					<div className='removerCodigoProdutosContent'>
						Deseja deletar o produto: {produtoSelected.produto} da marca{' '}
						{produtoSelected.marca}?
					</div>
					<div className='buttonsCodigoProdutos'>
						<button
							name='deletar'
							onClick={() =>
								deletarProduto(produtoSelected.id, closeModalRemove)
							}>
							Deletar
						</button>
						<button onClick={closeModalRemove} name='fechar'>
							Fechar
						</button>
					</div>
				</div>
			</Modal>

			<Modal isOpen={isOpenModalEdit} onClose={closeModalEdit}>
				<div className='editarCodigoProdutos headerGenerico'>
					<h1> Editar código de produto </h1>
					<form
						className='formProdutos'
						onSubmit={(e) => editarCodigo(e, closeModalEdit)}
						method='POST'>
						<input type='hidden' name='idProduto' value={produtoSelected?.id} />

						<AutoComplete
							nameInput='nomeProduto'
							placeholder='Nome do Produto'
							nome={true}
							valorPadrao={produtoSelected?.produto}
						/>

						<AutoComplete
							nameInput='marcaProduto'
							placeholder='Marca do Produto'
							marca={true}
							valorPadrao={produtoSelected?.marca}
						/>

						<input
							name='codigoProduto'
							type='text'
							placeholder='Código do Produto'
							defaultValue={produtoSelected?.codigo}
						/>
						<div className='buttonsCodigoProdutos'>
							<input
								type='submit'
								value='Finalizar edição'
								disabled={loading}
							/>
							<button onClick={closeModalEdit} name='cancelar'>
								Fechar
							</button>
						</div>
					</form>
				</div>
			</Modal>
		</React.Fragment>
	);
}
