'use client';

import React, { useEffect, useRef, useState } from 'react';
import { FuncoesProvider } from '../../Contexto/FuncoesContext';
import Modal from '@/Componentes/Modal/Modal';
import { useAuth } from '@/Contexto/AuthContext';
import ValidadesProvider, { useValidades } from '@/Contexto/ValidadesContext';
import { ValidadeProduto } from '@/Contexto/ValidadesContext';
import AddButton from '@/Componentes/AddButton/AddButton';
import FiltroValidades from '@/Componentes/BotaoFiltroValidades/FiltroValidades';
import BarraBusca from '@/Componentes/BarraBusca/BarraBusca';
import ModalCeres from '@/Componentes/ModalCeres/ModalCeres';
import useModalCeres from '@/Componentes/ModalCeres/useModalCeres';
import ListaProdutos from '@/Componentes/ListaProdutosMemo/ListaProdutos';
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
		fetchAddCodeEanPlu,
		loading,
		produtosExibidos,
		setFiltroAtivo,
	} = useValidades();

	const { user } = useAuth();

	const {
		isOpen: isOpenModalScanner,
		openModal: openModalScanner,
		closeModal: closeModalScanner,
	} = useModalCeres();

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

	const {
		isOpen: isOpenModalAddCodeBar,
		openModal: openModalAddCodeBar,
		closeModal: closeModalAddCodeBar,
	} = useModal();

	const {
		isOpen: isOpenModalAddEanPlu,
		openModal: openModalAddEanPlu,
		closeModal: closeModalAddEanPlu,
	} = useModal();

	const handleFecharGeral = () => {
		// 1. A faxina dos dados (Essencial para o Ceres não mostrar "fantasmas")
		setFormEditData(INITIAL_STATE);

		// 2. O "mordomo" passando e fechando todas as portas
		closeModalAdicionar();
		closeModalEditar();
		closeModalAddCodeBar();
		closeModalAddEanPlu();

		// Se o hook não existir ou não for achado, o JS daria erro,
		// mas como eles estão declarados no topo do seu componente Pai,
		// eles SEMPRE estarão lá disponíveis.
	};

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

	// useEffect(() => {
	// 	const codigo = FormEditData?.codigoProduto;

	// 	if (
	// 		codigo &&
	// 		(codigo.length === 13 || codigo.length === 5) &&
	// 		!FormEditData?.idRelacionado
	// 	) {
	// 		const timer = setTimeout(() => {
	// 			fetchScanDb(codigo);
	// 		}, 600); // Aumentei um tiquinho para dar fôlego ao banco

	// 		return () => clearTimeout(timer);
	// 	}
	// }, [FormEditData?.codigoProduto, FormEditData?.idRelacionado]);

	// const fetchScanDb = async (codigo: string) => {
	// 	const codigoLimpo = String(codigo || '').trim();

	// 	// 1. Trava simples de comprimento (evita lixo no banco)
	// 	if (codigoLimpo.length < 5) return;

	// 	try {
	// 		setLoadingScanner(true);

	// 		const response = await fetch(
	// 			`${acesso_validades}/procurar?codigo=${encodeURIComponent(codigoLimpo)}`,
	// 		);

	// 		const data = await response.json();

	// 		if (data.status === 'success') {
	// 			//console.log(data);
	// 			setFormEditData((prev) => ({
	// 				...prev,
	// 				produto: data.produto.descricao_produto,
	// 				marca_produto: data.produto.marca_produto,
	// 				codigoInterno: data.produto.plu_produto,
	// 				codigoProduto: data.produto.ean_produto,
	// 				idRelacionado: data.produto.id,
	// 			}));
	// 		} else if (data.status === 'not_found') {
	// 			setFormEditData((prev) => ({
	// 				...prev,
	// 				codigoProduto: codigoLimpo,
	// 				idRelacionado: null, // Novo cadastro
	// 			}));
	// 		}
	// 	} catch (error) {
	// 		console.error('Erro na busca:', error);
	// 	} finally {
	// 		setLoadingScanner(false);
	// 	}
	// };

	const fetchScanDb = async (codigo: string) => {
		// 1. Limpeza inicial
		let codigoLimpo = String(codigo || '').trim();

		// 2. LÓGICA DE FATIAMENTO (Parsing do QR Code/Etiqueta)
		if (codigoLimpo.includes(':')) {
			const partes = codigoLimpo.split(':');
			// Se o formato for :p:12345:d:123
			// partes[0] = "", partes[1] = "p", partes[2] = "12345"
			if (partes[2]) {
				codigoLimpo = partes[2];
			}
		}

		// 3. Trava simples de comprimento (evita lixo no banco)
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
					codigoProduto: codigoLimpo, // Aqui ele já vai estar "limpinho"
					idRelacionado: null,
				}));
			}
		} catch (error) {
			console.error('Erro na busca:', error);
		} finally {
			setLoadingScanner(false);
		}
	};

	const mesAtual = new Date().toLocaleString('pt-BR', { month: 'long' });

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

					<ListaProdutos
						formIdEditar={setFormEditData}
						openModalEditar={openModalEditar}
						produtosExibidos={produtosExibidos}
					/>
				</React.Fragment>
			)}

			<Modal
				isOpen={isOpenAdicionar}
				onClose={handleFecharGeral}
				loadingScanner={loadingScanner}
				onSubmit={(e) => fetchAddValidade(e, handleFecharGeral)}
				onScan={openModalScanner}
				tipoModal='usuario'
				loadingButtons={loadingButtons}
			/>

			<Modal
				isOpen={isOpenModalAddCodeBar}
				onClose={handleFecharGeral}
				loadingScanner={loadingScanner}
				dadosIniciais={FormEditData}
				onSubmit={(e) => fetchAddValidade(e, handleFecharGeral)}
				onScan={openModalScanner}
				fetchScan={(code) => fetchScanDb(String(code))}
				tipoModal='add_codigo'
				loadingButtons={loadingButtons}
			/>

			<Modal
				isOpen={isOpenModalAddEanPlu}
				onClose={handleFecharGeral}
				loadingScanner={loadingScanner}
				dadosIniciais={FormEditData}
				onSubmit={(e) => fetchAddCodeEanPlu(e, handleFecharGeral)}
				fetchScan={(code) => fetchScanDb(String(code))}
				onScan={openModalScanner}
				tipoModal='eanplu'
				loadingButtons={loadingButtons}
			/>

			<Modal
				isOpen={isOpenEditar}
				onClose={handleFecharGeral}
				loadingScanner={loadingScanner}
				dadosIniciais={FormEditData}
				onDelete={(id) => fetchDeletarValidade(id, handleFecharGeral)}
				onSubmit={(e) => fetchEditarValidade(e, handleFecharGeral)}
				onScan={openModalScanner}
				tipoModal='editar'
				loadingButtons={loadingButtons}
			/>

			{/* MODAL DE SCANNER */}
			<ModalCeres
				id='ceres-scanner-geral'
				isOpen={isOpenModalScanner}
				onClose={closeModalScanner}
				onResult={(codigo) => {
					fetchScanDb(codigo); // A função de busca já atualiza o FormEditData
					closeModalScanner(); // Fecha o scanner após ler
				}}
			/>
			{/* BOTOES DE ADICIONAR */}
			<AddButton
				openModalAddBarCode={openModalAddCodeBar}
				openModalAddUser={openModalAdicionar}
				openModalAddEanPlu={openModalAddEanPlu}
				addUser
				addBarCode={true}
				addValidade={true}
			/>
			<BarraBusca />
		</div>
	);
}
