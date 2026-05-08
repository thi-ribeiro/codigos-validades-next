'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { FuncoesProvider } from '../../Contexto/FuncoesContext';
import Modal from '@/Componentes/Modal/Modal';
import AutoComplete from '@/Componentes/AutoComplete/AutoComplete';
import { useAuth } from '@/Contexto/AuthContext';
import ValidadesProvider, { useValidades } from '@/Contexto/ValidadesContext';
import { ValidadeProduto } from '@/Contexto/ValidadesContext';
import AddButton from '@/Componentes/AddButton/AddButton';
import FiltroValidades from '@/Componentes/BotaoFiltroValidades/FiltroValidades';
import { useToast } from '@/Contexto/Toast';
import BarraBusca from '@/Componentes/BarraBusca/BarraBusca';
import ModalCeres from '@/Componentes/ModalCeres/ModalCeres';
import useModalCeres from '@/Componentes/ModalCeres/useModalCeres';
import { IoBarcode, IoBarcodeOutline, IoScan } from 'react-icons/io5';

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

export interface scanCode {
	fetchScanDb: (codigo: number | string) => void;
}

const acesso_validades = process.env.NEXT_PUBLIC_VALIDADES_API;

function CarregarPagina({}: Props) {
	const {
		fetchValidades,
		fetchAddValidade,
		fetchEditarValidade,
		fetchDeletarValidade,
		loadingButtons,
		dataFimIntervalo,
		calcularDiasRestantes,
		ValidadeVerificada,
		//ValidadeFinalizada,
		ProdutoEmRebaixa,
		fetchAddCodeEanPlu,
		loading,
		produtosExibidos,
		setFiltroAtivo,
		listaBruta,
	} = useValidades();

	const { user, isLoading } = useAuth();

	const { addToast } = useToast();

	const {
		isOpen: isOpenAdicionar,
		openModal: openModalAdicionar,
		closeModal: closeModalAdicionar,
	} = useModalCeres();

	const {
		isOpen: isOpenEditar,
		openModal: openModalEditar,
		closeModal: closeModalEditar,
	} = useModalCeres();

	const {
		isOpen: isOpenModalAddCodeBar,
		openModal: openModalAddCodeBar,
		closeModal: closeModalAddCodeBar,
	} = useModalCeres();

	const {
		isOpen: isOpenModalScanner,
		openModal: openModalScanner,
		closeModal: closeModalScanner,
	} = useModalCeres();

	const {
		isOpen: isOpenModalAddEanPlu,
		openModal: openModalAddEanPlu,
		closeModal: closeModalAddEanPlu,
	} = useModalCeres();

	const handleOpenAdicionar = () => {
		setFormEditData(INITIAL_STATE);
		openModalAdicionar();
	};
	const handleOpenAddCodeBar = () => {
		setFormEditData(INITIAL_STATE);
		openModalAddCodeBar();
	};
	const handleOpenAddEanPlu = () => {
		setFormEditData(INITIAL_STATE);
		openModalAddEanPlu();
	};

	const [codigoLido, setCodigoLido] = useState<{ ean: string; plu: string }>({
		ean: '',
		plu: '',
	});

	const [loadingScanner, setLoadingScanner] = useState<boolean>(false);

	const INITIAL_STATE: ValidadeProduto = {
		idvalidades: 0,
		produto: '',
		codigoProduto: '',
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
		codigoInterno: '',
		descricao_produto: '',
	};

	// No componente:
	const [FormEditData, setFormEditData] =
		useState<ValidadeProduto>(INITIAL_STATE);

	useEffect(() => {
		// Se o user existe, eu busco. Se não existe (deslogado ou carregando), não faço nada.
		if (user) {
			const empresa = user.role !== 1 ? user.empresa : undefined;
			fetchValidades(empresa);
		}
		// Deixando apenas [user.id] ou [user], o React só dispara quando o usuário loga
	}, [user?.role]);

	useEffect(() => {
		// Se NENHUM dos modais estiver aberto, significa que um deles acabou de fechar
		if (!isOpenAdicionar && !isOpenEditar && !isOpenModalAddCodeBar) {
			setFormEditData(INITIAL_STATE);
		}
	}, [isOpenAdicionar, isOpenEditar, isOpenModalAddCodeBar]);

	useEffect(() => {
		const codigo = FormEditData?.codigoProduto;

		// SÓ BUSCA SE:
		// 1. Tiver o tamanho certo
		// 2. O idRelacionado for null (significa que ainda não buscamos ou não achamos)
		if (
			codigo &&
			(codigo.length === 13 || codigo.length === 5) &&
			!FormEditData?.idRelacionado
		) {
			const timer = setTimeout(() => {
				fetchScanDb(codigo);
			}, 600); // Aumentei um tiquinho para dar fôlego ao banco

			return () => clearTimeout(timer);
		}
	}, [FormEditData?.codigoProduto, FormEditData?.idRelacionado]);

	const definirItemNoArray = (idSelecionado: number) => {
		// Agora a gente ignora a data e foca no ID dentro da lista principal
		const produtoParaEditar = listaBruta.find(
			(item) => item.idvalidades === idSelecionado,
		);

		if (produtoParaEditar) {
			// Aqui você seta o estado que o seu Modal de edição consome
			setFormEditData(produtoParaEditar);
		}
	};

	const handleChange = (
		e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
	) => {
		const { name, value, type } = e.target;

		// Define o valor final antes de atualizar o estado
		let finalValue: string | number;

		if (type === 'checkbox') {
			finalValue = Number((e.target as HTMLInputElement).checked);
		} else {
			finalValue = name === 'quantidade' ? Number(value) : value;
		}

		// Atualização limpa
		setFormEditData((prevData) => ({
			...prevData,
			[name]: finalValue,
		}));
	};

	const fetchScanDb = async (codigo: string) => {
		const codigoLimpo = String(codigo || '').trim();

		// 1. Trava simples de comprimento (evita lixo no banco)
		if (codigoLimpo.length < 5) return;

		try {
			setLoadingScanner(true);

			const response = await fetch(
				`${acesso_validades}/procurar?codigo=${encodeURIComponent(codigoLimpo)}`,
			);

			const data = await response.json();

			if (data.status === 'success') {
				setFormEditData((prev) => ({
					...prev,
					produto: data.produto.descricao_produto,
					marca_produto: data.produto.marca_produto,
					codigoInterno: data.produto.plu_produto,
					codigoProduto: data.produto.ean_produto,
					idRelacionado: data.produto.id,
				}));
			} else if (data.status === 'not_found') {
				setFormEditData((prev) => ({
					...prev,
					codigoProduto: codigoLimpo,
					idRelacionado: null, // Novo cadastro
				}));
			}
		} catch (error) {
			console.error('Erro na busca:', error);
		} finally {
			setLoadingScanner(false);
		}
	};
	const useLoadingDots = (isLoading: Boolean) => {
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

	const getInicial = (nome: string) => nome?.charAt(0).toUpperCase() || '?';
	const mesAtual = new Date().toLocaleString('pt-BR', { month: 'long' });
	const dots = useLoadingDots(loadingScanner);

	const ListaDeProdutosMemoized = useMemo(() => {
		return Object.keys(produtosExibidos).map((marca) => (
			<div key={marca} className='grupo-por-marca'>
				<h2 className='divisor-marca'>{marca}</h2>
				<div className='lista-cards'>
					{produtosExibidos[marca]?.map((validade) => (
						<div
							className={`card-validade ${validade.finalizado === 1 ? 'card-finalizado' : null} `}
							key={validade.idvalidades + validade.validadeDiaMes}>
							{/* Linha 1: Produto e Info Principal */}
							<div className='card-topo'>
								<div className='card-produto-info'>
									<div className='card-detalhes-produto-responsavel'>
										<span className='card-produto-separador'>
											<span className='card-produto-responsavel'>
												{getInicial(validade.responsavel)}
											</span>
											<span className='card-produto-nome'>
												{validade.produto}
											</span>
										</span>
									</div>

									<span className='card-produto-marca'>
										{validade.marca_produto}
									</span>
									<span className='card-produto-codigo'>
										PLU:{' '}
										{validade.codigoInterno || 'Código interno não cadastrado.'}
									</span>
								</div>
								<div className='card-info-badges'>
									<span className='badge-quantidade'>
										{validade.quantidade_produto}
									</span>
									<span className='badge-validade'>
										{validade.validadeDiaMes.substring(0, 5)}
									</span>
								</div>
							</div>

							{validade.finalizado !== 1 && (
								<div className='card-base'>
									<div className='card-restante'>
										{calcularDiasRestantes(
											validade.validade,
											validade.finalizado,
										)}
									</div>
									<div
										className='card-status-icones'
										onClick={() => {
											definirItemNoArray(
												validade.idvalidades,
												// validade.validadeDiaMes,
											);
											openModalEditar();
										}}>
										<ValidadeVerificada
											verificado={validade.verificado}
											dataInserida={validade.data_inserido}
										/>
										<ProdutoEmRebaixa
											Rebaixa={validade.rebaixa}
											dataRebaixa={validade.data_rebaixa}
										/>
									</div>
								</div>
							)}
						</div>
					))}
				</div>
			</div>
		));
	}, [produtosExibidos]);

	return (
		<div className='validadesPage'>
			{loading ? (
				<div className='loaderContainer'>
					<div className='loader'></div>
				</div>
			) : (
				<React.Fragment>
					<FiltroValidades
						filtrarVencimentos={() => setFiltroAtivo('vencendo')}
						filtrarEmAberto={() => setFiltroAtivo('Em Aberto')}
						filtrarFinalizados={() => setFiltroAtivo('finalizado')}
					/>

					<h1>
						De {mesAtual} até {dataFimIntervalo}
					</h1>
					{Object.keys(produtosExibidos).length > 0 ? (
						ListaDeProdutosMemoized
					) : (
						<p className='mensagem-vazia'>
							Nenhum produto para exibir no momento.
						</p>
					)}
				</React.Fragment>
			)}

			{/* MODAL EDITAR VALIDADE */}
			<Modal isOpen={isOpenEditar} onClose={closeModalEditar}>
				<form
					className='formularioEditarValidade'
					onSubmit={(e) => fetchEditarValidade(e, closeModalEditar)}>
					<h2>Editar Validade e Status</h2>

					<label htmlFor='codigoProduto'>Código de Barras:</label>
					<div className='add_scan_codigo_barras'>
						<input
							id='codigoProduto'
							name='codigoProduto'
							type='text'
							value={FormEditData?.codigoProduto || ''}
							onChange={handleChange}
							placeholder='Código de Barras'
						/>

						<div className='nav-icon-scanner'>
							<IoBarcodeOutline size={30} onClick={openModalScanner} />
						</div>
					</div>

					<label htmlFor='codigoInterno'>Código interno:</label>
					<input
						id='codigoInterno'
						name='codigoInterno'
						type='text'
						value={FormEditData?.codigoInterno || codigoLido.plu || ''}
						onChange={handleChange}
						placeholder='Código interno'
					/>

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
						readOnly={FormEditData?.codigoInterno ? true : false}
					/>
					<label htmlFor='marca'>Marca:</label>
					<input
						type='text'
						name='marca'
						defaultValue={FormEditData?.marca_produto}
						readOnly={FormEditData?.codigoInterno ? true : false}
					/>

					<label htmlFor='validade'>Validade:</label>
					<input
						type='date'
						id='validade'
						name='validade'
						required
						value={FormEditData.validade.split('T')[0]}
						onChange={handleChange}
					/>
					<label htmlFor='quantidade'>
						{/* {Number(FormEditData?.quantidade_produto.replace(/\D/g, ''))} */}
						Quantidade: {FormEditData?.quantidade_produto}
					</label>
					<input
						type='number'
						id='quantidade'
						name='quantidade_produto'
						required
						onChange={handleChange}
						placeholder={FormEditData?.quantidade_produto}
						// value={Number(FormEditData?.quantidade_produto.replace(/\D/g, ''))}
						value={
							Number(FormEditData?.quantidade_produto.replace(/\D/g, '')) ||
							FormEditData?.quantidade_produto
						}
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

					<div className='functionsButons'>
						<div className='buttonSubmCanc'>
							{(FormEditData?.responsavel === user?.usuario ||
								user?.role === 1) && (
								<React.Fragment>
									<button
										type='button'
										disabled={loadingButtons}
										style={{
											backgroundColor: '#d32f2f', // Vermelho se carregando, verde se normal
											color: 'white',
											cursor: loadingButtons ? 'not-allowed' : 'pointer',
											transition: '0.3s', // Para a mudança de cor ser suave
										}}
										onClick={() =>
											fetchDeletarValidade(
												FormEditData.idvalidades,
												closeModalEditar,
											)
										}>
										{loadingButtons ? 'Processando...' : 'Remover'}
									</button>

									<button
										type='submit'
										disabled={loadingButtons} // Desativa o botão enquanto loadingButtons for true
										style={{
											backgroundColor: loadingButtons ? '#d32f2f' : '#4CAF50', // Vermelho se carregando, verde se normal
											color: 'white',
											cursor: loadingButtons ? 'not-allowed' : 'pointer',
											transition: '0.3s', // Para a mudança de cor ser suave
										}}>
										{loadingButtons ? 'Processando...' : 'Atualizar'}
									</button>
								</React.Fragment>
							)}

							<button type='button' onClick={closeModalEditar}>
								Cancelar
							</button>
						</div>
					</div>
				</form>
			</Modal>

			{/* MODAL ADICIONAR VIA CODE BAR */}
			<Modal isOpen={isOpenModalAddCodeBar} onClose={closeModalAddCodeBar}>
				<form
					className='formularioAdicionarValidade'
					onSubmit={(e) => fetchAddValidade(e, closeModalAddCodeBar)}>
					<h2>Adicionar Validade Via Código de Barras</h2>

					<label htmlFor='codigoProduto'>Código de Barras:</label>
					<div className='add_scan_codigo_barras'>
						<input
							id='codigoProduto'
							name='codigoProduto'
							type='text'
							inputMode='numeric' // Força teclado numérico no celular sem quebrar o evento
							value={FormEditData?.codigoProduto || ''}
							onChange={handleChange}
							maxLength={13}
							placeholder='Código de Barras'
							autoComplete='off' // Evita que o preenchimento automático do celular trave o campo
						/>

						<div className='nav-icon-scanner'>
							<IoBarcodeOutline size={30} onClick={openModalScanner} />
						</div>
					</div>

					<label htmlFor='codigoInterno'>Código interno:</label>

					<input
						id='codigoInterno'
						name='codigoInterno'
						type='text'
						inputMode='numeric' // Força teclado numérico no celular sem quebrar o evento
						value={FormEditData?.codigoInterno || ''}
						onChange={handleChange}
						placeholder={
							loadingScanner
								? `Carregando ${dots}`
								: 'Código interno do produto.'
						}
						autoComplete='off'
					/>

					<label htmlFor='produto'>Produto:</label>

					<AutoComplete
						nome={true}
						placeholder={
							loadingScanner
								? `Carregando ${dots}`
								: 'Digite o nome do produto.'
						}
						nameInput='produto'
						valorPadrao={FormEditData?.produto || ''}
						required={true}
					/>

					<label htmlFor='marca'>Marca:</label>
					{user?.empresa ? (
						<input type='text' name='marca' value={user?.empresa} readOnly />
					) : (
						<AutoComplete
							marca={true}
							placeholder={
								loadingScanner ? `Carregando ${dots}` : 'Digite a marca.'
							}
							nameInput='marca'
							valorPadrao={FormEditData?.marca_produto || ''}
							required={false}
						/>
					)}

					<label htmlFor='validade'>Validade:</label>
					<input type='date' id='validade' name='validade' required />
					<label htmlFor='quantidade'>Quantidade:</label>
					<input type='number' id='quantidade' name='quantidade' required />
					<label htmlFor='tipoquantidade'>Tipo de quantidade:</label>
					<select
						id='tipoquantidade'
						name='tipoquantidade'
						defaultValue='un'
						required>
						<option value='cx'>Caixas</option>
						<option value='g'>Gramas</option>
						<option value='l'>Litros</option>
						<option value='ml'>Mililitros</option>
						<option value='pc'>Pacotes</option>
						<option value='kg'>Quilos</option>
						<option value='un'>Unidades</option>
					</select>

					<div className='functionsButons'>
						<div className='buttonSubmCanc'>
							<button
								type='submit'
								disabled={loadingButtons} // Desativa o botão enquanto loadingButtons for true
								style={{
									backgroundColor: loadingButtons ? '#d32f2f' : '#4CAF50', // Vermelho se carregando, verde se normal
									color: 'white',
									cursor: loadingButtons ? 'not-allowed' : 'pointer',
									transition: '0.3s', // Para a mudança de cor ser suave
								}}>
								{loadingButtons ? 'Processando...' : 'Adicionar'}
							</button>

							<button
								type='button'
								className='suas-classes-de-cancelar'
								onClick={closeModalAddCodeBar}>
								Cancelar
							</button>
						</div>
					</div>
				</form>
			</Modal>

			{/* MODAL ADICIONAR EAN / PLU */}
			<Modal isOpen={isOpenModalAddEanPlu} onClose={closeModalAddEanPlu}>
				<form
					className='formularioAdicionarValidade'
					onSubmit={(e) => fetchAddCodeEanPlu(e, closeModalAddEanPlu)}>
					<h2>Adicionar Código EAN / PLU</h2>

					<label htmlFor='codigoProduto'>Código de Barras:</label>
					<div className='add_scan_codigo_barras'>
						<input
							id='codigoProduto'
							name='codigoProduto'
							type='text'
							inputMode='numeric' // Força teclado numérico no celular sem quebrar o evento
							value={FormEditData?.codigoProduto || ''}
							onChange={handleChange}
							maxLength={13}
							placeholder='Código de Barras'
							required
							autoComplete='off' // Evita que o preenchimento automático do celular trave o campo
						/>

						<div className='nav-icon-scanner'>
							<IoBarcodeOutline size={30} onClick={openModalScanner} />
						</div>
					</div>

					<label htmlFor='codigoInterno'>Código interno:</label>

					<input
						id='codigoInterno'
						name='codigoInterno'
						type='text'
						inputMode='numeric' // Força teclado numérico no celular sem quebrar o evento
						value={FormEditData?.codigoInterno || ''}
						onChange={handleChange}
						required
						maxLength={5}
						placeholder={
							loadingScanner
								? `Carregando ${dots}`
								: 'Código interno do produto.'
						}
						autoComplete='off'
					/>

					<label htmlFor='produto'>Produto:</label>

					<AutoComplete
						nome={true}
						valorPadrao={FormEditData?.produto || ''}
						placeholder={
							loadingScanner
								? `Carregando ${dots}`
								: 'Digite o nome do produto.'
						}
						nameInput='produto'
						required={true}
					/>

					<label htmlFor='marca'>Marca:</label>
					{user?.empresa ? (
						<input type='text' name='marca' value={user?.empresa} readOnly />
					) : (
						<AutoComplete
							marca={true}
							valorPadrao={FormEditData?.marca_produto || ''}
							placeholder={
								loadingScanner ? `Carregando ${dots}` : 'Digite a marca.'
							}
							nameInput='marca'
							required={false}
							eanplu={true}
						/>
					)}

					<div className='functionsButons'>
						<div className='buttonSubmCanc'>
							<button
								type='submit'
								disabled={loadingButtons} // Desativa o botão enquanto loadingButtons for true
								style={{
									backgroundColor: loadingButtons ? '#d32f2f' : '#4CAF50', // Vermelho se carregando, verde se normal
									color: 'white',
									cursor: loadingButtons ? 'not-allowed' : 'pointer',
									transition: '0.3s', // Para a mudança de cor ser suave
								}}>
								{loadingButtons ? 'Adicionando...' : 'Adicionar'}
							</button>
							<button type='button' onClick={closeModalAddEanPlu}>
								Cancelar
							</button>
						</div>
					</div>
				</form>
			</Modal>

			{/* COMPONENTES E MODAIS DE SCANNER */}

			<ModalCeres
				id='ceres-scanner-geral'
				isOpen={isOpenModalScanner}
				onClose={closeModalScanner}
				onResult={(codigo) => {
					fetchScanDb(codigo); // A função de busca já atualiza o FormEditData
					closeModalScanner(); // Fecha o scanner após ler
				}}
			/>

			<AddButton
				openModalAddBarCode={handleOpenAddCodeBar} // Chama a função que limpa e abre
				openFuncion={handleOpenAdicionar} // Chama a função que limpa e abre
				openModalAddEanPlu={handleOpenAddEanPlu} // Chama a função que limpa e abre
				addUser
				addBarCode={true}
				addValidade={true}
			/>

			<BarraBusca />
		</div>
	);
}
