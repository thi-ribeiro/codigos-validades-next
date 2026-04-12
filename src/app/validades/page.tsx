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
import { useToast } from '@/Contexto/Toast';
import { form } from 'framer-motion/client';
import FiltroValidades from '@/Componentes/BotaoFiltroValidades/FiltroValidades';

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
	const { limitaTexto } = useFuncoes();
	const { addToast } = useToast();

	const {
		fetchValidades,
		fetchAddValidade,
		fetchEditarValidade,
		fetchDeletarValidade,
		produtosValidades,
		produtosValidadesFinalizados,
		marcasProdutos,
		dataFimIntervalo,
		calcularDiasRestantes,
		ValidadeVerificada,
		ValidadeFinalizada,
		ProdutoEmRebaixa,
		loading,
		produtosExibidos,
		setFiltroAtivo,
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

	const dataAtual = new Date();
	const mesAnoAtual = format(dataAtual, 'MMMM/yyyy', { locale: ptBR });

	const [filtroMarca, setFiltroMarca] = useState<string>('');
	// const [teste, setteste] = useState<string | number>('');
	const [codigoLido, setCodigoLido] = useState<string>('');

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
		if (codigoLido && codigoLido !== FormEditData?.codigoProduto) {
			// Simula um evento para o handleChange ou atualiza direto
			setFormEditData((prev) => ({ ...prev, codigoProduto: codigoLido }));
			scanCodeDb(codigoLido);
		}
	}, [codigoLido]);

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
						setCodigoLido(decodedText);
						navigator.vibrate(200);

						// 4. USAR A REF PARA PARAR
						fecharModalScanner();
					},
					() => {},
				);
			} catch (err) {
				console.error('Erro ao iniciar:', err);
			}
		}, 300); // 300ms é o tempo do modal animar
	};

	// useEffect(() => {
	// 	// Função de limpeza que o React executa ANTES de o modal sumir da tela
	// 	return () => {
	// 		const matarHardware = async () => {
	// 			if (scannerRef.current) {
	// 				try {
	// 					// Verificamos se está rodando (ajuste o isScanning se for booleano no seu TS)
	// 					const isRunning =
	// 						typeof scannerRef.current.isScanning === 'function'
	// 							? scannerRef.current.isScanning
	// 							: scannerRef.current.isScanning;

	// 					if (isRunning) {
	// 						await scannerRef.current.stop();
	// 						console.log('Hardware liberado com sucesso.');
	// 					}
	// 				} catch (err) {
	// 					console.warn('Tentativa de parar falhou, mas limpando ref.');
	// 				} finally {
	// 					scannerRef.current = null;
	// 					// Força a limpeza de trilhas de vídeo se necessário
	// 					const videoTracks = document.querySelector('video')
	// 						?.srcObject as MediaStream;
	// 					videoTracks?.getTracks().forEach((track) => track.stop());
	// 				}
	// 			}
	// 		};
	// 		matarHardware();
	// 	};
	// }, [isOpenModalAddCodeBar]); // Fica de olho no estado do Modal

	const fecharComSeguranca = async () => {
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

		// 2. Agora que a câmera desligou, a gente fecha o Modal de fato
		closeModalAddCodeBar();
		setFormEditData(INITIAL_STATE);
		setCodigoLido('');
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

	const definirItemNoArray = (idSelecionado: number, marca: string) => {
		if (idSelecionado) {
			const itemCompletoSelecionado = produtosValidades[marca]?.find(
				(item) => item.idvalidades === idSelecionado,
			);

			setFormEditData(itemCompletoSelecionado ?? ({} as ValidadeProduto));
		}
		//setIsModalEditOpen(true);
	};

	const handleChange = (
		e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
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

	const scanCodeDb = async (codigo: string) => {
		// Evita buscar se o código for muito curto (opcional)
		if (codigo.length < 10) return;

		try {
			const response = await fetch(
				`${acesso_validades}/procurar/?codigo=${codigo}`,
			);
			const data = await response.json();

			if (data.status === 'success' && data.produto) {
				// Supondo que seu estado do formulário se chame FormEditData
				// Nós "mesclamos" os dados novos com o que já existe
				setFormEditData((prev) => ({
					...prev,
					produto: data.produto.descricao_produto, // Preenche o nome
					marca: data.produto.marca_produto, // Preenche a marca
					codigoInterno: data.produto.plu_produto, // Preenche o PLU
					codigoProduto: data.produto.ean_produto, // Garante que o EAN esteja certo
					idRelacionado: data.produto.id, // Guarda o ID para o UPDATE posterior
				}));

				console.log('Produto autocompletado com sucesso!');
			} else {
				// Caso não ache, você pode optar por limpar os campos ou deixar o usuário digitar
				console.log('Produto não encontrado no banco.');
			}
		} catch (error) {
			console.error('Erro ao consultar banco de dados:', error);
		}
	};

	const handleAutoScan = (e: React.ChangeEvent<HTMLInputElement>) => {
		const valor = e.target.value;

		// 1. Atualiza o estado normalmente (mantém o que o usuário digita)
		handleChange(e);

		// 2. Lógica de busca automática:
		// Dispara se tiver 13 dígitos (EAN) ou se você definir um mínimo para códigos internos (ex: 4 dígitos)
		if (valor.length === 13 || (valor.length >= 3 && valor.length <= 6)) {
			scanCodeDb(valor);
		}
	};

	const getInicial = (nome: string) => nome?.charAt(0).toUpperCase() || '?';

	const mesAtual = new Date().toLocaleString('pt-BR', { month: 'long' });

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
						filtrarTodos={() => setFiltroAtivo('todos')}
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
										className='card-validade'
										key={validade.idvalidades}
										onClick={() => {
											definirItemNoArray(
												validade.idvalidades,
												validade.marca_produto,
											);
											openModalEditar();
										}}>
										{/* Linha 1: Produto e Info Principal */}
										<div className='card-topo'>
											<div className='card-produto-info'>
												<div className='card-detalhes-produto-responsavel'>
													<span className='card-produto-responsavel'>
														{getInicial(validade.responsavel)}
													</span>
													<span className='card-produto-nome'>
														{/* {limitaTexto(validade.produto, 28)} */}
														{validade.produto}
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

										{/* Linha 2: Status e Ícones */}
										<div className='card-base'>
											<div className='card-restante'>
												{calcularDiasRestantes(
													validade.validade,
													validade.finalizado,
												)}
											</div>
											<div className='card-status-icones'>
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
									</div>
								))}
							</div>
						</div>
					))}
				</React.Fragment>
			)}

			<Modal isOpen={isOpenAdicionar} onClose={closeModalAdicionar}>
				<form
					className='formularioAdicionarValidade'
					onSubmit={(e) => fetchAddValidade(e, closeModalAdicionar)}>
					<h2>Adicionar Validade</h2>

					<label htmlFor='codigoProduto'>Código de Barras:</label>
					<div className='add_scan_codigo_barras'>
						<input
							id='codigoProduto'
							name='codigoProduto'
							type='text'
							value={FormEditData?.codigoProduto || codigoLido}
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
						value={FormEditData?.codigoInterno || ''}
						onChange={handleChange}
						placeholder='Código interno'
					/>

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
					{/* <button type='submit'>Adicionar</button> */}

					<div className='functionsButons'>
						<div className='buttonSubmCanc'>
							<button
								type='submit'
								disabled={loading} // Desativa o botão enquanto loading for true
								style={{
									backgroundColor: loading ? '#d32f2f' : '#4CAF50', // Vermelho se carregando, verde se normal
									color: 'white',
									cursor: loading ? 'not-allowed' : 'pointer',
									transition: '0.3s', // Para a mudança de cor ser suave
								}}>
								{loading ? 'Adicionando...' : 'Adicionar'}
							</button>
							<button type='button' onClick={closeModalAdicionar}>
								Cancelar
							</button>
						</div>
					</div>
				</form>
			</Modal>

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
							value={FormEditData?.codigoProduto || codigoLido}
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
						value={FormEditData?.codigoInterno || ''}
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

					<div className='functionsButons'>
						<div className='buttonSubmCanc'>
							{(FormEditData?.responsavel === user?.usuario ||
								user?.role === 1) && (
								<React.Fragment>
									<button
										type='button'
										disabled={loading}
										style={{
											backgroundColor: '#d32f2f', // Vermelho se carregando, verde se normal
											color: 'white',
											cursor: loading ? 'not-allowed' : 'pointer',
											transition: '0.3s', // Para a mudança de cor ser suave
										}}
										onClick={() =>
											fetchDeletarValidade(
												FormEditData.idvalidades,
												closeModalEditar,
											)
										}>
										{loading ? 'Processando...' : 'Remover'}
									</button>

									<button
										type='submit'
										disabled={loading} // Desativa o botão enquanto loading for true
										style={{
											backgroundColor: loading ? '#d32f2f' : '#4CAF50', // Vermelho se carregando, verde se normal
											color: 'white',
											cursor: loading ? 'not-allowed' : 'pointer',
											transition: '0.3s', // Para a mudança de cor ser suave
										}}>
										{loading ? 'Processando...' : 'Atualizar'}
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

			<Modal isOpen={isOpenModalAddCodeBar} onClose={fecharComSeguranca}>
				<form
					className='formularioAdicionarValidade'
					onSubmit={(e) => fetchAddValidade(e, fecharComSeguranca)}>
					<h2>Adicionar Validade Via Código de Barras</h2>

					<label htmlFor='codigoProduto'>Código de Barras:</label>
					<div className='add_scan_codigo_barras'>
						{/* <input
							id='codigoProduto'
							name='codigoProduto'
							type='text'
							// Use apenas o estado do formulário para evitar confusão de valores
							value={FormEditData?.codigoProduto || ''}
							onChange={handleAutoScan}
							maxLength={13}
							placeholder='Código de Barras'
						/> */}

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
						value={FormEditData?.codigoInterno || ''}
						onChange={handleChange}
						placeholder='Código interno'
					/>

					<label htmlFor='produto'>Produto:</label>

					<AutoComplete
						nome={true}
						placeholder='Digite o nome do produto'
						nameInput='produto'
						valorPadrao={FormEditData?.produto || ''}
						required={true}
					/>

					{/* <input
						id='produto'
						name='produto'
						type='text'
						value={FormEditData?.produto || ''}
						onChange={handleChange}
						placeholder='Digite o nome do produto'
					/> */}

					<label htmlFor='marca'>Marca:</label>
					{user?.empresa ? (
						<input type='text' name='marca' value={user?.empresa} readOnly />
					) : (
						<AutoComplete
							marca={true}
							placeholder='Digite a marca do produto'
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
								disabled={loading} // Desativa o botão enquanto loading for true
								style={{
									backgroundColor: loading ? '#d32f2f' : '#4CAF50', // Vermelho se carregando, verde se normal
									color: 'white',
									cursor: loading ? 'not-allowed' : 'pointer',
									transition: '0.3s', // Para a mudança de cor ser suave
								}}>
								{loading ? 'Processando...' : 'Adicionar'}
							</button>

							<button
								type='button'
								className='suas-classes-de-cancelar'
								onClick={fecharComSeguranca}>
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
				addUser
				addBarCode={true}
				addValidade={true}
			/>
		</div>
	);
}
