import React, { useContext, createContext, useState } from 'react';
import { useAuth } from './AuthContext';
import { useToast } from './Toast';
import _ from 'lodash';
import { ptBR } from 'date-fns/locale';
import { differenceInDays, format, isAfter } from 'date-fns';
import {
	IoIosCheckmarkCircleOutline,
	IoIosCloseCircleOutline,
	IoMdTrendingDown,
} from 'react-icons/io';

export interface ProviderProps {
	children: React.ReactNode;
}

export interface ValuesInterface {
	fetchValidades: (produtoMarca?: string) => Promise<void>;
	fetchAddValidade: (
		e: React.FormEvent,
		callbackSucesso: () => void,
	) => Promise<void>;
	fetchEditarValidade: (
		e: React.FormEvent,
		callbackSucesso: () => void,
	) => Promise<void>;
	fetchDeletarValidade: (
		id: string | number,
		callbackSucesso: () => void,
	) => void;
	formatarDataParaMySQL: (data: Date) => string;
	ValidadeVerificada: (props: {
		verificado: number;
		dataInserida: string;
	}) => React.JSX.Element;
	ValidadeFinalizada: (props: {
		finalizado: number;
		dataFinalizado: string;
		verificado: number;
	}) => React.JSX.Element;
	ProdutoEmRebaixa: (props: {
		Rebaixa: number;
		dataRebaixa: string;
	}) => React.JSX.Element;
	calcularDiasRestantes: (
		dataDeValidade: string,
		finalizado: number,
	) => React.JSX.Element;
	produtosValidades: Record<string, ValidadeProduto[]>;
	marcasProdutos: Record<string, MarcaProdutoInterface[]>;
	produtosValidadesFinalizados: Record<string, ValidadeProduto[]>;
	loading: boolean;
	dataFimIntervalo: string | 'Indefinido';
}

export interface ValidadeProduto {
	idvalidades: number;
	produto: string;
	validade: string; // Ou Date, se você for convertê-la no frontend
	responsavel: string;
	data_inserido: string; // Ou Date
	verificado: number; // Ou boolean, se você for convertê-lo
	data_verificado: string; // Ou Date
	finalizado: number; // Ou boolean
	data_finalizado: string; // Ou Date
	validadeDiaMes: string; // Formato 'dd/mm/yyyy'
	marca_produto: string; // Adicionando a marca do produto
	quantidade_produto: string;
	codigoProduto: string;
	codigoInterno: string;
	rebaixa: number;
	data_rebaixa: string;
	tipoquantidade: string;
}

export interface MarcaProdutoInterface {
	marca_produto: string;
}

interface ResponseData {
	auth?: boolean; // 'auth' é opcional aqui, pois pode não vir em todas as respostas
	status?: string; // 'status' também é opcional, caso venha para mensagens de info/erro
	message?: string; // 'message' também é opcional
	marcas?: any[]; // Melhor ainda: string[]
	dados?: any[]; // Melhor ainda: ValidadeProduto[]
	dataFimIntervalo?: Date;
}

const acesso_validades = process.env.NEXT_PUBLIC_VALIDADES_API;

const ValidadesContexto = createContext<ValuesInterface | undefined>(undefined);

export default function ValidadesProvider({ children }: ProviderProps) {
	const [produtosValidades, setProdutosValidades] = useState<
		Record<string, ValidadeProduto[]>
	>({});

	const [dataFimIntervalo, setdataFimIntervalo] = useState<string>('');

	const [marcasProdutos, setmarcasProdutos] = useState<
		Record<string, MarcaProdutoInterface[]>
	>({});

	const [produtosValidadesFinalizados, setProdutosValidadesFinalizados] =
		useState<Record<string, ValidadeProduto[]>>({});

	const [loading, setLoading] = useState(true);
	// const [isModalOpen, setIsModalOpen] = useState(false);
	// const [isModalEditOpen, setIsModalEditOpen] = useState(false);

	const { user, logout } = useAuth();
	const { addToast } = useToast();

	const dataAtual = new Date();

	const fetchValidades = async (produtoMarca: string = '') => {
		setLoading(true);
		try {
			// Agora apontamos para a nossa nova API interna do Next.js
			// Passamos apenas a marca, pois o resto a API resolve via Cookie/JWT
			const response = await fetch(
				`${acesso_validades}/listar/?marca=${produtoMarca}`,
				{
					method: 'GET',
					headers: {
						'Content-Type': 'application/json',
					},
					// Importante manter para o Middleware ler o seu cookie auth_token
					credentials: 'include',
				},
			);

			const data = await response.json();

			// Se a API retornar erro de autenticação (ex: 401)
			if (response.status === 401) {
				setLoading(false);
				logout();
				return;
			}

			// data.dados contém os produtos e data.marcas as marcas para o filtro
			if (data && Array.isArray(data.dados) && Array.isArray(data.marcas)) {
				setmarcasProdutos(data.marcas);
				setdataFimIntervalo(data.dataFimIntervalo);

				const agruparPorStatus = _.chain(data.dados)
					.groupBy((item) =>
						item.finalizado === 1 ? 'finalizados' : 'pendentes',
					)
					.value();

				const agrupar = _.chain(data.dados).groupBy('marca_produto').value();

				const agrupamentoValidadePorMarcaProdutoPendente = _.groupBy(
					agruparPorStatus.pendentes,
					'marca_produto',
				);

				const agrupamenteoValidadeFinalizado = _.groupBy(
					agruparPorStatus.finalizados,
					'marca_produto',
				);

				//console.log(agrupamenteoValidadeFinalizado);

				setProdutosValidades(agrupar);
				console.log(agrupar);
				//setProdutosValidadesFinalizados(agrupamenteoValidadeFinalizado);

				// Formatação do intervalo (Ex: "Janeiro/2026")
				if (data.dataFimIntervalo) {
					setdataFimIntervalo(
						format(new Date(data.dataFimIntervalo), 'MMMM/yyyy', {
							locale: ptBR,
						}),
					);
				}
			} else {
				// Se for o caso de 'Nenhuma validade encontrada' (status 200 ou 404)
				setProdutosValidades({});
				if (data.marcas) setmarcasProdutos(data.marcas);
			}
		} catch (error: any) {
			console.error('Fetch error:', error);
			// addToast('Erro ao carregar dados', 'error');
		} finally {
			setLoading(false);
		}
	};

	const formatarDataParaMySQL = (data: Date): string => {
		const pad = (num: number) => String(num).padStart(2, '0');

		const ano = data.getUTCFullYear();
		const mes = pad(data.getUTCMonth() + 1);
		const dia = pad(data.getUTCDate());
		const horas = pad(data.getUTCHours());
		const minutos = pad(data.getUTCMinutes());
		const segundos = pad(data.getUTCSeconds());

		return `${ano}-${mes}-${dia} ${horas}:${minutos}:${segundos}`;
	};

	const fetchAddValidade = async (
		e: React.FormEvent,
		callbackSucesso: () => void,
	) => {
		e.preventDefault();
		setLoading(true);

		const formData = new FormData(e.target as HTMLFormElement);
		const produto = formData.get('produto') as string;
		const validade = formData.get('validade') as string;
		const quantidade = formData.get('quantidade') as string;
		const marca = (formData.get('marca') as string).trimEnd();
		const tipoQuantidade = formData.get('tipoquantidade') as string;
		const codigoProduto = formData.get('codigoProduto') as string;
		const codigoInterno = formData.get('codigoInterno') as string;

		const quantidadeDesc = `${quantidade} ${tipoQuantidade}`;

		try {
			// Aponta para a nova rota da API no Next.js
			const response = await fetch(`${acesso_validades}/adicionar`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					produto,
					marca,
					validade,
					quantidadeDesc,
					responsavel: user?.usuario,
					id_responsavel: user?.uid,
					codigoProduto: codigoProduto,
					codigoInterno: codigoInterno,
					// Mantemos sua função de formatar data para o MySQL
					data_inserido: formatarDataParaMySQL(new Date()),
				}),
				//credentials: 'include',
			});

			// Se o servidor retornar 401 (Não autorizado), o Middleware ou a API avisam
			if (response.status === 401) {
				setLoading(false);
				logout();
				return;
			}

			const data = await response.json();

			if (data && data.status === 'success') {
				addToast(data.message, data.status);
				// Atualiza a lista após inserir
				await fetchValidades();
				// Executa o callback (geralmente fechar o modal ou limpar form)
				callbackSucesso();
			} else {
				addToast(data.message || 'Erro ao cadastrar', data.status || 'error');
			}
		} catch (error) {
			console.error('Fetch error:', error);
			addToast(
				'Erro ao conectar com o servidor. Verifique sua conexão.',
				'error',
			);
		} finally {
			setLoading(false);
		}
	};

	const fetchEditarValidade = async (
		e: React.FormEvent,
		callbackSucesso: () => void,
	) => {
		e.preventDefault();
		setLoading(true);

		const form = e.target as HTMLFormElement;
		const formData = new FormData(form);

		// Captura os checkboxes verificando se eles estão REALMENTE no formData
		const verificado = form.querySelector<HTMLInputElement>(
			'input[name="verificado"]',
		)?.checked
			? 1
			: 0;
		const finalizado = form.querySelector<HTMLInputElement>(
			'input[name="finalizado"]',
		)?.checked
			? 1
			: 0;
		const rebaixa = form.querySelector<HTMLInputElement>(
			'input[name="rebaixa"]',
		)?.checked
			? 1
			: 0;

		const dadosParaEnviar = {
			// Forçamos o ID a ser número para não quebrar o WHERE no MySQL da Vercel
			id_validade: Number(formData.get('id_validade')),
			produto: formData.get('produto') as string,
			marca: (formData.get('marca') as string).trimEnd(),
			validade: formData.get('validade') as string,
			// Garanta que o name do input de quantidade seja 'quantidade_produto'
			quantidadeDesc: `${formData.get('quantidade_produto')} ${formData.get('tipoquantidade')}`,
			responsavel: user?.usuario || 'Sistema',
			id_responsavel: user?.uid ? Number(user.uid) : null,
			codigoProduto: formData.get('codigoProduto') || 0,
			codigoInterno: formData.get('codigoInterno') || 0,
			verificado,
			finalizado,
			rebaixa,
		};

		try {
			const response = await fetch(`${acesso_validades}/editar`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(dadosParaEnviar),
			});

			const data = await response.json();

			if (response.ok && data.status === 'success') {
				addToast(data.message, 'success');
				callbackSucesso();
				// Importante: fetchValidades() aqui atualiza sua lista principal
				await fetchValidades();
			} else {
				// Se cair aqui, o 'data.message' vai te dizer o erro real do MySQL (ex: coluna faltando)
				addToast(data.message || 'Erro ao atualizar', 'error');
			}
		} catch (error) {
			addToast('Erro de conexão com o servidor', 'error');
		} finally {
			setLoading(false);
		}
	};

	const ValidadeVerificada = (props: {
		verificado: number;
		dataInserida: string;
	}) => {
		if (!!props.verificado) {
			//NEGACAO DUPLA, QUE LINDO!?! FORçA O BOOLEANO
			return (
				<IoIosCheckmarkCircleOutline
					size={20}
					color={'green'}
					title={props.dataInserida}
				/>
			);
		} else {
			return (
				<IoIosCloseCircleOutline
					size={20}
					color={'red'}
					title='Aguardando aprovação.'
				/>
			);
		}
	};

	const ProdutoEmRebaixa = (props: {
		Rebaixa: number;
		dataRebaixa: string;
	}) => {
		if (!!props.Rebaixa) {
			return (
				<IoMdTrendingDown size={20} color={'green'} title={props.dataRebaixa} />
			);
		} else {
			return (
				<IoMdTrendingDown
					size={20}
					color={'#aaa'}
					title={'Aguardando rebaixe...'}
				/>
			);
		}
	};

	const ValidadeFinalizada = (props: {
		finalizado: number;
		dataFinalizado: string;
		verificado: number;
	}) => {
		if (!!props.verificado) {
			if (!!props.finalizado) {
				return (
					<IoIosCheckmarkCircleOutline
						size={20}
						color={'green'}
						title={props.dataFinalizado}
					/>
				);
			} else {
				return (
					<IoIosCloseCircleOutline
						size={20}
						color={'red'}
						title='Aguardando finalização.'
					/>
				);
			}
		} else {
			//AQUI ESTA DESATIVADO, POIS A VALIDADE NÃO FOI VERIFICADA
			return (
				<IoIosCloseCircleOutline
					size={20}
					color={'#aaa'}
					title='Aguardando aprovação.'
				/>
			);
		}
	};

	const calcularDiasRestantes = (
		dataDeValidade: string,
		finalizado: number,
	): React.JSX.Element => {
		const dataExpiracao = new Date(dataDeValidade);
		//const dataAtual = new Date();

		if (finalizado) {
			return (
				<div style={{ color: 'green', fontWeight: 'bold' }}>Finalizado</div>
			);
		} else {
			if (isAfter(dataAtual, dataExpiracao)) {
				return <div style={{ color: 'red', fontWeight: 'bold' }}>Vencido</div>;
			}
		}

		const diasRestantes = differenceInDays(dataExpiracao, dataAtual);
		//const venceDiatal = addDays(dataAtual, diasRestantes);
		const dataFormatada = format(dataDeValidade, 'EEEE (dd/MM)', {
			locale: ptBR,
		});

		if (diasRestantes === 0) {
			return <div style={{ color: 'orange', fontWeight: 'bold' }}>Hoje</div>;
		}

		return (
			<div
				aria-label={dataFormatada}
				data-balloon-pos='right'
				className='toogleDescription'>
				{diasRestantes} dia(s)
			</div>
		);
	};

	const fetchDeletarValidade = async (
		id: string | number,
		callbackSucesso: () => void,
	) => {
		// 1. Confirmação para evitar exclusão por erro
		if (!confirm('Tem certeza que deseja remover esta validade?')) return;

		//setLoading(true);

		try {
			const response = await fetch(`${acesso_validades}/deletar`, {
				method: 'DELETE', // Usamos o método DELETE para ser bem profissional
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ id_validade: id }),
			});

			const data = await response.json();

			if (data.status === 'success') {
				addToast(data.message, data.status);
				callbackSucesso(); // Fecha o modal

				const listaFiltrada = Object.values(produtosValidades)
					.flat()
					.filter((item) => item.idvalidades !== id);

				const novaListaProdutos = Object.groupBy(
					listaFiltrada,
					(item) => item.marca_produto,
				) as Record<string, ValidadeProduto[]>;

				setProdutosValidades(novaListaProdutos);
			} else {
				addToast(data.message, 'error');
				setLoading(false);
			}
		} catch (error) {
			addToast('Erro ao deletar', 'error');
			setLoading(false);
		}
	};

	const contextValues: ValuesInterface = {
		fetchValidades,
		fetchAddValidade,
		fetchEditarValidade,
		fetchDeletarValidade,
		formatarDataParaMySQL,
		calcularDiasRestantes,
		ValidadeVerificada,
		ValidadeFinalizada,
		ProdutoEmRebaixa,
		produtosValidades,
		marcasProdutos,
		produtosValidadesFinalizados,
		dataFimIntervalo,
		loading,
		// isModalOpen,
		// isModalEditOpen,
		// setIsModalOpen,
		// setIsModalEditOpen,
	};

	return (
		<ValidadesContexto.Provider value={contextValues}>
			{children}
		</ValidadesContexto.Provider>
	);
}

export const useValidades = () => {
	const context = useContext(ValidadesContexto);
	if (context === undefined) {
		throw new Error('Deve ser usado dentro do validadesContexto.');
	}
	return context;
};
