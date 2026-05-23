import React from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import QRCode from 'qrcode';
import { AiOutlineFilePdf } from 'react-icons/ai'; // Ou o ícone que você escolher

// 1. Tipando o formato do produto que o componente vai receber
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
	descricao_produto: string;
	idRelacionado?: number | null;
}

// 2. Definindo que o componente precisa receber a lista de produtos como propriedade (Prop)
interface BotaoPdfProps {
	listaProdutos: ValidadeProduto[];
	mesOffset?: number;
}

export default function BotaoGerarPdf({ listaProdutos }: BotaoPdfProps) {
	// 3. A função assíncrona isolada dentro do componente
	const gerarPdfValidadesMes = async (mesOffset = 0) => {
		if (!listaProdutos || listaProdutos.length === 0) {
			alert('Não há produtos disponíveis para gerar o relatório!');
			return;
		}

		const doc = new jsPDF({
			orientation: 'portrait',
			unit: 'mm',
			format: 'a4',
		});

		const meses = [
			'Janeiro',
			'Fevereiro',
			'Março',
			'Abril',
			'Maio',
			'Junho',
			'Julho',
			'Agosto',
			'Setembro',
			'Outubro',
			'Novembro',
			'Dezembro',
		];
		const dataAlvo = new Date();
		dataAlvo.setMonth(dataAlvo.getMonth() + mesOffset);

		const mesNumero = String(dataAlvo.getMonth() + 1).padStart(2, '0');
		const nomeMes = dataAlvo.toLocaleString('pt-BR', { month: 'long' });

		// Filtra usando o mesNumero calculado
		const produtosDoMes = listaProdutos.filter((item) => {
			return (
				item.validadeDiaMes.includes(`/${mesNumero}`) ||
				item.validadeDiaMes.includes(`-${mesNumero}-`)
			);
		});

		if (produtosDoMes.length === 0) {
			alert(`Nenhum produto vencendo em ${nomeMes}!`);
			return;
		}

		// Cabeçalho do documento
		doc.setFont('helvetica', 'bold');
		doc.setFontSize(16);
		doc.text(`Ceres App - Relatório de Validades`, 14, 15);

		doc.setFont('helvetica', 'normal');
		doc.setFontSize(11);
		doc.text(`Mês de Referência: ${nomeMes}`, 14, 22);
		doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 14, 28);

		doc.setDrawColor(220, 220, 220);
		doc.line(14, 32, 196, 32);

		const colunas = ['QR Code - Plu', 'Produto', 'Vencimento'];

		// Pré-geração dos QR Codes em Base64
		const listaQrCodesBase64: string[] = [];
		for (const item of produtosDoMes) {
			const conteudoQr = item.codigoInterno;
			const qrBase64 = await QRCode.toDataURL(conteudoQr, {
				margin: 1,
				width: 50,
			});
			listaQrCodesBase64.push(qrBase64);
		}

		const linhas = produtosDoMes.map((item) => [
			'',
			item.produto,
			item.validadeDiaMes,
		]);

		autoTable(doc, {
			startY: 36,
			head: [colunas],
			body: linhas,
			theme: 'grid',
			// 1. Padding geral bem pequeno para as colunas de texto (Produto e Validade)
			styles: {
				valign: 'middle',
				fontSize: 9,
				cellPadding: 1, // Padding mínimo para o texto
			},
			columnStyles: {
				0: {
					cellWidth: 30,
					halign: 'center', // 'center' centraliza o QR Code horizontalmente na célula
					valign: 'middle', //  'middle' centraliza o QR Code verticalmente na célula
					minCellHeight: 15,
				},
				1: { cellWidth: 'auto', halign: 'left' },
				2: { cellWidth: 30, halign: 'center' },
			},

			didDrawCell: (data) => {
				// 1. Verificação de segurança: Só desenha se for o corpo da tabela e a coluna correta
				if (data.column.index === 0 && data.cell.section === 'body') {
					// 2. Garante que o índice da linha existe na nossa lista de QR Codes
					const rowIndex = data.row.index;
					const qrCodeDataUrl = listaQrCodesBase64[rowIndex];

					// 3. Só tenta desenhar se o QR Code existir e a célula for válida
					if (qrCodeDataUrl && data.cell) {
						const padding = 1;
						const size = data.cell.height - padding * 2;

						// A proteção contra o 'undefined' é garantir que o objeto 'data.cell' existe
						doc.addImage(
							qrCodeDataUrl,
							'PNG',
							data.cell.x + padding,
							data.cell.y + padding,
							size,
							size,
						);
					}
				}
			},
		});

		doc.save(
			`validades_${nomeMes.toLowerCase()}_${dataAlvo.getFullYear()}.pdf`,
		);
	};

	// 4. O retorno do componente (o botão que aparece na tela)
	return (
		<div className='container-botoes-gerar-pdf'>
			<button onClick={() => gerarPdfValidadesMes(0)}>PDF Atual</button>
			<button onClick={() => gerarPdfValidadesMes(1)}>PDF Próximo</button>
		</div>
	);
}
