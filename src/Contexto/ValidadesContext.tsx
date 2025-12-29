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
		callbackSucesso: () => void
	) => Promise<void>;
	fetchEditarValidade: (
		e: React.FormEvent,
		callbackSucesso: () => void
	) => Promise<void>;
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
		finalizado: number
	) => React.JSX.Element;
	produtosValidades: Record<string, ValidadeProduto[]>;
	marcasProdutos: MarcaProdutoInterface[];
	loading: boolean;
	dataFimIntervalo: string | 'Indefinido';
	// isModalOpen: boolean;
	// isModalEditOpen: boolean;
	// setIsModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
	// setIsModalEditOpen: React.Dispatch<React.SetStateAction<boolean>>;
	// buscar: string;
	// setBuscar: React.Dispatch<React.SetStateAction<string>>;
	// limitaTexto: (texto: string, quantidade?: number) => React.JSX.Element;
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

const acesso_fetch = process.env.NEXT_PUBLIC_API_URL;

const ValidadesContexto = createContext<ValuesInterface | undefined>(undefined);

export default function ValidadesProvider({ children }: ProviderProps) {
	const [produtosValidades, setProdutosValidades] = useState<
		Record<string, ValidadeProduto[]>
	>({});

	const [dataFimIntervalo, setdataFimIntervalo] = useState<string>('');

	const [marcasProdutos, setmarcasProdutos] = useState<MarcaProdutoInterface[]>(
		[]
	);

	const [loading, setLoading] = useState(false);
	// const [isModalOpen, setIsModalOpen] = useState(false);
	// const [isModalEditOpen, setIsModalEditOpen] = useState(false);

	const { user, logout } = useAuth();
	const { addToast } = useToast();

	const dataAtual = new Date();

	const fetchValidades = async (produtoMarca: string = '') => {
		setLoading(true);
		try {
			const response = await fetch(
				`${acesso_fetch}?consultaValidades=true&idUsuario=${user?.uid}&produtoMarca=${produtoMarca}`,
				{
					method: 'GET',
					headers: {
						'Content-Type': 'application/json',
					},
					credentials: 'include', // Se seu backend usa cookies (como o JWT que configuramos)
				}
			);

			const data: ResponseData = await response.json();

			//console.log(data);
			//console.log(data.auth);

			if (data?.auth === false) {
				setLoading(false); // Desativa o loading antes de sair
				logout();
				return;
			}

			if (data && Array.isArray(data.marcas) && Array.isArray(data.dados)) {
				setmarcasProdutos(data.marcas);

				const agrupamentoValidadePorMarcaProduto = _.groupBy(
					data.dados,
					'marca_produto'
				);

				setProdutosValidades(agrupamentoValidadePorMarcaProduto);

				setdataFimIntervalo(
					format(data.dataFimIntervalo || new Date(), 'MMMM/yyyy', {
						locale: ptBR,
					})
				);
			} else {
				setProdutosValidades({}); // Limpa se não houver dados válidos
			}

			//console.log(data.message);
		} catch (error: string | any) {
			console.error('Fetch error:', error);
			//addToast(error, 'error');
		}

		setLoading(false);
		return;
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
		callbackSucesso: () => void
	) => {
		e.preventDefault();

		setLoading(true);

		//console.log('Tentando adicionar validade');

		const formData = new FormData(e.target as HTMLFormElement);
		const produto = formData.get('produto') as string;
		const validade = formData.get('validade') as string;
		const quantidade = formData.get('quantidade') as string;
		const marca = formData.get('marca') as string;
		const tipoQuantidade = formData.get('tipoquantidade') as string;

		const quantidadeDesc = `${quantidade} ${tipoQuantidade}`;

		try {
			const response = await fetch(`${acesso_fetch}?adicionarValidade=true`, {
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
					data_inserido: formatarDataParaMySQL(new Date()),
				}),
				credentials: 'include',
			});

			const data = await response.json();

			//console.log('Adicionada validade', data);

			if (data?.auth === false) {
				setLoading(false); // Desativa o loading antes de sair
				logout();
				return;
			}

			if (data && data.status === 'success') {
				addToast(data.message, data.status);
				fetchValidades();
			} else {
				addToast(data.message, data.status);
			}
		} catch (error) {
			console.error('Fetch error:', error);
			addToast('Erro ao adicionar validade. Tente novamente.', 'error');
		}

		callbackSucesso();
		setLoading(false);
	};

	const fetchEditarValidade = async (
		e: React.FormEvent,
		callbackSucesso: () => void
	) => {
		e.preventDefault();

		setLoading(true);

		//console.log('Tentando adicionar validade');

		const formData = new FormData(e.target as HTMLFormElement);
		const id_validade = formData.get('id_validade') as string;
		const produto = formData.get('produto') as string;
		const validade = formData.get('validade') as string;
		const quantidade = formData.get('quantidade_produto') as string;
		const marca = formData.get('marca') as string;
		const tipoQuantidade = formData.get('tipoquantidade') as string;

		const quantidadeDesc = `${quantidade} ${tipoQuantidade}`;

		const verificado = formData.get('verificado') ? 1 : 0;
		const finalizado = formData.get('finalizado') ? 1 : 0;
		const rebaixa = formData.get('rebaixa') ? 1 : 0;

		try {
			const response = await fetch(`${acesso_fetch}?editarValidade=true`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					id_validade,
					produto,
					marca,
					validade,
					quantidadeDesc,
					responsavel: user?.usuario,
					id_responsavel: user?.uid,
					//data_inserido: formatarDataParaMySQL(new Date()),
					verificado: verificado,
					data_verificado: verificado
						? formatarDataParaMySQL(new Date())
						: null,
					finalizado: finalizado,
					data_finalizado: finalizado
						? formatarDataParaMySQL(new Date())
						: null,
					rebaixa: rebaixa,
					data_rebaixa: rebaixa ? formatarDataParaMySQL(new Date()) : null,
				}),
				credentials: 'include',
			});

			const data = await response.json();

			//console.log('Adicionada validade', data);

			if (data?.auth === false) {
				setLoading(false); // Desativa o loading antes de sair
				logout();
				return;
			}

			if (data && data.status === 'success') {
				addToast(data.message, data.status);
				fetchValidades(); // Recarrega as validades após adicionar

				//console.log('OK foi!', data);
			} else {
				addToast(data.message, data.status);
			}
		} catch (error) {
			console.error('Fetch error:', error);
			addToast('Erro ao adicionar validade. Tente novamente.', 'error');
		}

		callbackSucesso();
		//setIsModalEditOpen(false);
		setLoading(false);
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
		finalizado: number
	): React.JSX.Element => {
		const dataExpiracao = new Date(dataDeValidade);
		//const dataAtual = new Date();

		if (finalizado) {
			return <div>Finalizado</div>;
		} else {
			if (isAfter(dataAtual, dataExpiracao)) {
				return <div>Vencido</div>;
			}
		}

		const diasRestantes = differenceInDays(dataExpiracao, dataAtual);
		//const venceDiatal = addDays(dataAtual, diasRestantes);
		const dataFormatada = format(dataDeValidade, 'EEEE (dd/MM)', {
			locale: ptBR,
		});

		if (diasRestantes === 0) {
			return <div>Hoje</div>;
		}

		return (
			<div
				aria-label={dataFormatada}
				data-balloon-pos='up'
				className='toogleDescription'>
				{diasRestantes} dias
			</div>
		);
	};

	const contextValues: ValuesInterface = {
		fetchValidades,
		fetchAddValidade,
		fetchEditarValidade,
		formatarDataParaMySQL,
		calcularDiasRestantes,
		ValidadeVerificada,
		ValidadeFinalizada,
		ProdutoEmRebaixa,
		produtosValidades,
		marcasProdutos,
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
