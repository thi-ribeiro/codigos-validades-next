'use client';

import React, { useEffect, useState } from 'react';
import Modal from '@/Componentes/Modal/Modal';
import { useValidades } from '@/Contexto/ValidadesContext';
import { ValidadeProduto } from '@/Contexto/ValidadesContext';
import AddButton from '@/Componentes/AddButton/AddButton';
import FiltroValidades from '@/Componentes/BotaoFiltroValidades/FiltroValidades';
import BarraBusca from '@/Componentes/BarraBusca/BarraBusca';
import ModalCeres from '@/Componentes/ModalCeres/ModalCeres';
import useModalCeres from '@/Componentes/ModalCeres/useModalCeres';
import ListaProdutos from '@/Componentes/ListaProdutosMemo/ListaProdutos';
import useModal from '@/Componentes/Modal/useModal';

type Props = {};

const acesso_validades = process.env.NEXT_PUBLIC_VALIDADES_API;

export default function page({}: Props) {
	const {
		fetchHistorico,
		fetchAddValidade,
		fetchEditarValidade,
		fetchDeletarValidade,
		loadingButtons,
		fetchAddCodeEanPlu,
		loading,
		produtosExibidos,
		setFiltroAtivo,
	} = useValidades();

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
		// Se NENHUM dos modais estiver aberto, significa que um deles acabou de fechar
		if (!isOpenAdicionar && !isOpenEditar && !isOpenModalAddCodeBar) {
			setFormEditData(INITIAL_STATE);
		}
	}, [isOpenAdicionar, isOpenEditar, isOpenModalAddCodeBar]);

	const fetchScanDb = async (codigo: string) => {
		let codigoLimpo = String(codigo || '').trim();

		let interno = codigoLimpo.includes(':');
		let codigoTratado = interno ? codigoLimpo.split(':')[2] : codigoLimpo;

		// 3. Trava simples de comprimento (evita lixo no banco)
		if (codigoLimpo.length < 5) return;

		try {
			setLoadingScanner(true);

			const response = await fetch(
				`${acesso_validades}/procurar?codigo=${encodeURIComponent(codigoTratado)}`,
			);

			const data = await response.json();

			//alert(JSON.stringify(data.produto));

			if (data.status === 'success') {
				setFormEditData((prev) => ({
					...prev,
					produto: data.produto.descricao_produto,
					marca_produto: data.produto.marca_produto,
					codigoInterno: data.produto.plu_produto,
					codigoProduto: data.produto.ean_produto,
					idRelacionado: data.produto.id,
				}));
			} else {
				setFormEditData((prev) => ({
					...prev, // Aqui você já manteve os dois códigos!
					// Agora só atualiza o que foi escaneado no momento
					...(interno
						? { codigoInterno: codigoTratado }
						: { codigoProduto: codigoTratado }),
					idRelacionado: null,
				}));
			}
		} catch (error) {
			console.error('Erro na busca:', error);
		} finally {
			setLoadingScanner(false);
		}
	};

	return (
		<div className='validadesPage'>
			<React.Fragment>
				<FiltroValidades
					filtrarVencimentos={() => setFiltroAtivo('vencendo')}
					filtrarEmAberto={() => setFiltroAtivo('pendentes')}
					filtrarFinalizados={() => fetchHistorico()}
				/>

				<ListaProdutos
					loading={loading}
					formIdEditar={setFormEditData}
					openModalEditar={openModalEditar}
					produtosExibidos={produtosExibidos}
				/>
			</React.Fragment>

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
