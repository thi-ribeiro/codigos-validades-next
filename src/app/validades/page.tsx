'use client';

import React, { useEffect, useRef, useState } from 'react';
import { FuncoesProvider, useFuncoes } from '../../Contexto/FuncoesContext';

import { format } from 'date-fns';
import Modal from '@/Componentes/Modal/Modal';
import AutoComplete from '@/Componentes/AutoComplete/AutoComplete';
import { useAuth } from '@/Contexto/AuthContext';
//import { useRouter } from 'next/navigation';

// balloon-css import moved to global type/stylesheet, evita erro de declaração de módulo
import { ptBR } from 'date-fns/locale';
import ValidadesProvider, { useValidades } from '@/Contexto/ValidadesContext';
import { ValidadeProduto } from '@/Contexto/ValidadesContext';
import AddButton from '@/Componentes/AddButton/AddButton';

// import { Html5QrcodeScanner, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';

import useModal from '@/Componentes/Modal/useModal';
// import { useToast } from '@/Contexto/Toast';
// import { form } from 'framer-motion/client';
import FiltroValidades from '@/Componentes/BotaoFiltroValidades/FiltroValidades';
import { useToast } from '@/Contexto/Toast';
import {
	IoAdd,
	IoCloseOutline,
	IoRemoveCircle,
	IoSearchCircle,
} from 'react-icons/io5';
import BarraBusca from '@/Componentes/BarraBusca/BarraBusca';
// import { QRCodeSVG } from 'qrcode.react';

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
	scanCodeDb: (codigo: number | string) => void;
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
		ValidadeFinalizada,
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
		isOpen: isOpenModalScanner,
		openModal: openModalScanner,
		closeModal: closeModalScanner,
	} = useModal();

	const {
		isOpen: isOpenModalAddEanPlu,
		openModal: openModalAddEanPlu,
		closeModal: closeModalAddEanPlu,
	} = useModal();

	const dataAtual = new Date();
	const mesAnoAtual = format(dataAtual, 'MMMM/yyyy', { locale: ptBR });

	const [filtroMarca, setFiltroMarca] = useState<string>('');
	// const [teste, setteste] = useState<string | number>('');
	// const [codigoLido, setCodigoLido] = useState<string>('');
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
		if (!isLoading) {
			if (user?.role !== 1) {
				fetchValidades(user?.empresa);
			} else {
				fetchValidades();
			}
		}
	}, [isLoading]);

	useEffect(() => {
		// Se NENHUM dos modais estiver aberto, significa que um deles acabou de fechar
		if (!isOpenAdicionar && !isOpenEditar && !isOpenModalAddCodeBar) {
			setFormEditData(INITIAL_STATE);
		}
	}, [isOpenAdicionar, isOpenEditar, isOpenModalAddCodeBar]);

	useEffect(() => {
		// 1. Pega o valor que realmente importa (PLU se existir, senão EAN)
		const valorAtual = codigoLido.plu || codigoLido.ean;

		// 2. Só dispara se houver um valor e se ele for diferente do que já está no formulário
		if (
			valorAtual &&
			valorAtual !== FormEditData?.codigoProduto &&
			valorAtual !== FormEditData?.codigoInterno
		) {
			// 3. Atualiza o formulário com a string limpa
			setFormEditData((prev) => ({
				...prev,
				// Se for EAN (tamanho >=13), salva no campo de EAN, senão no Interno
				codigoProduto: codigoLido.ean || prev.codigoProduto,
				codigoInterno: codigoLido.plu || prev.codigoInterno,
			}));

			// 4. Envia apenas a STRING para a busca no banco, não o objeto
			scanCodeDb(valorAtual);
		}
	}, [codigoLido]); // Ele ainda monitora o objeto, mas extrai a string lá dentro

	const scannerRef = useRef<Html5Qrcode | null>(null);

	const startScanner = async () => {
		await openModalScanner();

		// 1. Pequeno delay para garantir que o Modal abriu e o ID 'reader' existe
		setTimeout(async () => {
			const readerElement = document.getElementById('reader');
			if (!readerElement) return;

			try {
				// 2. Criar a instância
				const html5QrCode = new Html5Qrcode('reader', {
					verbose: false,
					formatsToSupport: [
						Html5QrcodeSupportedFormats.EAN_13,
						Html5QrcodeSupportedFormats.EAN_8,
						Html5QrcodeSupportedFormats.CODE_128,
						// Html5QrcodeSupportedFormats.QR_CODE,
					],
				});

				// 3. SALVAR NA REF (Isso aqui é o que faltava!)
				scannerRef.current = html5QrCode;

				const config = {
					fps: 20,
					qrbox: { width: 280, height: 150 },
					aspectRatio: 1.0,
				};

				await html5QrCode.start(
					{ facingMode: 'environment' },
					config,
					(decodedText) => {
						if (decodedText.includes(':p:')) {
							const partes = decodedText.split(':');
							const pluExtraido = partes[2]; // Pega o que está entre o segundo e terceiro ':'

							// Garante que o que extraímos tem o tamanho de um PLU (4 a 6 dígitos)
							if (
								pluExtraido &&
								pluExtraido.length >= 4 &&
								pluExtraido.length <= 6
							) {
								setCodigoLido({ ean: '', plu: pluExtraido });
							}

							//alert(pluExtraido);
						}
						// 2. Se for um bip comum de EAN (13 dígitos)
						else if (decodedText.length >= 13) {
							setCodigoLido({ ean: decodedText, plu: '' });
						}
						// 3. Se for um bip comum de PLU (direto os 4 a 6 dígitos)
						else if (decodedText.length >= 4 && decodedText.length <= 6) {
							setCodigoLido({ ean: '', plu: decodedText });
						}
						navigator.vibrate(200);
						fecharModalScanner();
					},
					(errorMessage) => {},
				);
			} catch (err) {
				console.error('Erro ao iniciar:', err);
			}
		}, 300); // 300ms é o tempo do modal animar
	};

	const fecharComSeguranca = async (callbackFinal?: () => void) => {
		// 1. O Await entra aqui: Espera o hardware dizer "parei"
		if (scannerRef.current && scannerRef.current.isScanning) {
			try {
				await scannerRef.current.stop();
				console.log('Hardware parado com sucesso antes de fechar.');
			} catch (err) {
				console.warn('Erro ao parar, mas vamos fechar assim mesmo.');
			} finally {
				scannerRef.current = null;
			}
		}

		setFormEditData(INITIAL_STATE);
		setCodigoLido({ ean: '', plu: '' });

		if (callbackFinal) {
			callbackFinal();
		}
	};

	const fecharModalScanner = async () => {
		if (scannerRef.current) {
			try {
				// Se estiver rodando, para.
				if (scannerRef.current.isScanning) {
					await scannerRef.current.stop();
				}
			} catch (err) {
				console.warn('Erro ao parar, limpando ref...');
			} finally {
				// Limpa a referência para a próxima vez
				scannerRef.current = null;
			}
		}
		closeModalScanner();
	};

	const selecionaMarca = (e: React.FormEvent) => {
		e.preventDefault();
		//console.log(filtroMarca);

		fetchValidades(filtroMarca);

		//const marca = e.currentTarget.children[0].value;
		//setFiltroMarca(marca);
	};

	// const definirItemNoArray = (idSelecionado: number, dataChave: string) => {
	// 	// Se a chave não existir no objeto, produtosValidades[dataChave] será undefined
	// 	const listaDestaData = produtosValidades[dataChave];

	// 	if (listaDestaData) {
	// 		const item = listaDestaData.find((v) => v.idvalidades === idSelecionado);

	// 		if (item) {
	// 			setFormEditData(item);
	// 			return;
	// 		}
	// 	}

	// 	// Se chegou aqui, algo deu errado, então limpamos o form por segurança
	// 	setFormEditData(INITIAL_STATE);
	// };

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

	const scanCodeDb = async (codigo: string) => {
		// 1. Limpeza e Validação Inicial
		const codigoLimpo = String(codigo || '').trim();

		// Evita buscar códigos irrelevantes (ex: leituras acidentais de 2 ou 3 dígitos)
		// Se for PLU (interno) pode ser menor, se for EAN costuma ter 8, 13 ou 14.
		if (codigoLimpo.length < 6) return;

		try {
			setLoadingScanner(true);

			// O encodeURIComponent é vital para evitar que caracteres especiais quebrem a URL
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
				addToast('Produto não cadastrado.', 'info');

				setFormEditData((prev) => ({
					...prev,
					produto: '', // Limpando de verdade
					marca_produto: '',
					codigoInterno: '',
					//codigoProduto: '', // Importante limpar o código que falhou
					idRelacionado: null, // Não esqueça do ID se ele existir
				}));
			}
		} catch (error) {
			// Se o erro for porque cancelamos a requisição, nem mostra o toast
			//if (error.name !== 'AbortError') {
			addToast('Erro ao buscar produto.', 'error');
			//}
		} finally {
			setLoadingScanner(false);
		}
	};

	const handleAutoScan = (e: React.ChangeEvent<HTMLInputElement>) => {
		const valor = e.target.value;
		handleChange(e);
		scanCodeDb(valor);
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

	// const GeradorQRCode = ({
	// 	valorLink,
	// 	size,
	// }: {
	// 	valorLink: string;
	// 	size: number | 10;
	// }) => {
	// 	return (
	// 		<div className='qrCode-plu'>
	// 			<QRCodeSVG
	// 				value={valorLink}
	// 				size={size}
	// 				bgColor={'#ffffff'}
	// 				fgColor={'#000000'}
	// 				level={'L'} // Nível de correção de erro
	// 				// includeMargin={true}
	// 			/>
	// 		</div>
	// 	);
	// };

	return (
		<div className='validadesPage'>
			{loading ? (
				<div className='loaderContainer'>
					<div className='loader'></div>
				</div>
			) : (
				<React.Fragment>
					{/* {Object.keys(produtosValidadesFinalizados).map((marca) => (
						<div key={marca} className='grupo-por-marca'>
							<h2 className='divisor-marca'>{marca}</h2>
							<div className='lista-cards'>
								{produtosValidadesFinalizados[marca]?.map((validade) => (
									<div className='card-validade' key={validade.idvalidades}>
										{validade.produto}
									</div>
								))}
							</div>
						</div>
					))} */}

					<FiltroValidades
						filtrarVencimentos={() => setFiltroAtivo('vencendo')}
						filtrarEmAberto={() => setFiltroAtivo('Em Aberto')}
						filtrarFinalizados={() => setFiltroAtivo('finalizado')}
					/>

					<h1>
						De {mesAtual} até {dataFimIntervalo}
					</h1>

					{Object.keys(produtosExibidos).map((marca) => (
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
													<span className='card-produto-marca'>
														{validade.marca_produto}
													</span>
													<span className='card-produto-separador'>
														<span className='card-produto-responsavel'>
															{getInicial(validade.responsavel)}
														</span>
														<span className='card-produto-nome'>
															{validade.produto}
														</span>
													</span>
												</div>

												<span className='card-produto-codigo'>
													PLU:{' '}
													{validade.codigoInterno ||
														'Código interno não cadastrado.'}
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
										)}
									</div>
								))}
							</div>
						</div>
					))}
				</React.Fragment>
			)}

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
							value={FormEditData?.codigoProduto || codigoLido.ean || ''}
							onChange={handleChange}
							placeholder='Código de Barras'
						/>

						<button
							type='button'
							onClick={startScanner}
							disabled={loading}
							title='Scan'>
							Scanear
						</button>
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

			<Modal
				isOpen={isOpenModalAddCodeBar}
				onClose={() => fecharComSeguranca(closeModalAddCodeBar)}>
				<form
					className='formularioAdicionarValidade'
					onSubmit={(e) =>
						fetchAddValidade(e, () => fecharComSeguranca(closeModalAddCodeBar))
					}>
					<h2>Adicionar Validade Via Código de Barras</h2>

					<label htmlFor='codigoProduto'>Código de Barras:</label>
					<div className='add_scan_codigo_barras'>
						<input
							id='codigoProduto'
							name='codigoProduto'
							type='text'
							inputMode='numeric' // Força teclado numérico no celular sem quebrar o evento
							value={FormEditData?.codigoProduto || ''} // ÚNICA FONTE DE VERDADE
							onChange={handleAutoScan}
							maxLength={13}
							placeholder='Código de Barras'
							autoComplete='off' // Evita que o preenchimento automático do celular trave o campo
						/>

						<button type='button' onClick={startScanner} disabled={loading}>
							Scanear EAN
						</button>
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
								onClick={() => fecharComSeguranca(closeModalAddCodeBar)}>
								Cancelar
							</button>
						</div>
					</div>
				</form>
			</Modal>

			<Modal
				isOpen={isOpenModalAddEanPlu}
				onClose={() => fecharComSeguranca(closeModalAddEanPlu)}>
				<form
					className='formularioAdicionarValidade'
					onSubmit={(e) =>
						fetchAddCodeEanPlu(e, () => fecharComSeguranca(closeModalAddEanPlu))
					}>
					<h2>Adicionar Código EAN / PLU</h2>

					<label htmlFor='codigoProduto'>Código de Barras:</label>
					<div className='add_scan_codigo_barras'>
						<input
							id='codigoProduto'
							name='codigoProduto'
							type='text'
							inputMode='numeric' // Força teclado numérico no celular sem quebrar o evento
							value={FormEditData?.codigoProduto || ''}
							onChange={handleAutoScan}
							maxLength={13}
							placeholder='Código de Barras'
							autoComplete='off' // Evita que o preenchimento automático do celular trave o campo
						/>

						<button
							type='button'
							onClick={startScanner}
							disabled={loading}
							title='Limpar e Bipar novamente'>
							Scanear
						</button>
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
							<button
								type='button'
								onClick={() => fecharComSeguranca(closeModalAddEanPlu)}>
								Cancelar
							</button>
						</div>
					</div>
				</form>
			</Modal>

			<Modal isOpen={isOpenModalScanner} onClose={fecharModalScanner}>
				<h2>Escanear Código de Barras</h2>

				<div
					className='scanner-container'
					id='reader'
					style={{
						width: '100%',
						height: '100%',
						//minHeight: '300px',
					}}></div>
			</Modal>

			<AddButton
				openModalAddBarCode={openModalAddCodeBar}
				openFuncion={openModalAdicionar}
				openModalAddEanPlu={openModalAddEanPlu}
				addUser
				addBarCode={true}
				addValidade={true}
			/>

			<BarraBusca />
		</div>
	);
}
