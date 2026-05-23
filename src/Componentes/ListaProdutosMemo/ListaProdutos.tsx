import { useValidades, ValidadeProduto } from '@/Contexto/ValidadesContext';
import React, { memo } from 'react';
import { IoReturnUpBack } from 'react-icons/io5';
import LoadingLogo from '../LoadingLogo/LoadingLogo';
//import BotaoGerarPdf from '../GerarPdf/gerarPdfValidadesMes';

export interface produtosInterface {
	produtosExibidos: Record<string, ValidadeProduto[]>;
	openModalEditar: () => void;
	formIdEditar: (produto: ValidadeProduto) => void;
	loading: boolean;
}

const ListaProdutos = ({
	produtosExibidos,
	openModalEditar,
	formIdEditar,
	loading,
}: produtosInterface) => {
	const {
		calcularDiasRestantes,
		ValidadeVerificada,
		ProdutoEmRebaixa,
		listaBruta,
		obterStatusClasse,
		listaHistorico,
		nomeProduto,
		dataFimIntervalo,
		//validadesSeparadas,
	} = useValidades();

	const selecionarEEditar = (idSelecionado: number) => {
		let produtoParaEditar = listaBruta.find(
			(item) => Number(item.idvalidades) === idSelecionado,
		);

		if (!produtoParaEditar) {
			produtoParaEditar = listaHistorico.find(
				(item) => Number(item.idvalidades) === idSelecionado,
			);
		}

		if (produtoParaEditar) {
			formIdEditar(produtoParaEditar);
			openModalEditar();
		}
	};

	const getInicial = (nome: string) => nome?.charAt(0).toUpperCase() || '?';

	if (loading) {
		return (
			<LoadingLogo loading={true} mensagem='Carregando lista de produtos...' />
		);
	}

	if (Object.keys(produtosExibidos || {}).length === 0) {
		const mensagemAlerta =
			nomeProduto.trim() !== ''
				? 'Nenhum produto encontrado para a sua busca.'
				: 'Nenhum produto cadastrado para este filtro.';

		return (
			<div className='alerta-cards'>
				<h1>{mensagemAlerta}</h1>
			</div>
		);
	}

	return (
		<React.Fragment>
			<div className='alerta-cards'>
				<h1>Validades até {dataFimIntervalo}</h1>
			</div>
			{Object.keys(produtosExibidos).map((marca) => (
				<div key={marca} className='grupo-por-marca'>
					<h2 className='divisor-marca'>{marca}</h2>
					<div className='lista-cards'>
						{produtosExibidos[marca]?.map((validade) => (
							<div
								className={`card-validade ${obterStatusClasse(validade.validade, validade.finalizado)}`}
								key={validade.idvalidades}>
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
											{validade.codigoInterno ||
												'Código interno não cadastrado.'}
										</span>
									</div>
									<div className='card-info-badges'>
										{!!validade.finalizado && (
											<IoReturnUpBack
												size={20}
												title='Estornar ou editar item do histórico'
												onClick={() => {
													selecionarEEditar(validade.idvalidades);
												}}
											/>
										)}
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
											onClick={() => selecionarEEditar(validade.idvalidades)}>
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
			))}
		</React.Fragment>
	);
};

export default memo(ListaProdutos); // Use memo para evitar re-renderizacoes desnecessarias na listaProdutos;
