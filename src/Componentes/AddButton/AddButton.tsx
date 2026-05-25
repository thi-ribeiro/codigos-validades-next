import { useAuth } from '@/Contexto/AuthContext';
import { useValidades } from '@/Contexto/ValidadesContext';
import jsPDF from 'jspdf';
import React, { useContext, useState } from 'react';
import { IoMdBarcode, IoMdPersonAdd } from 'react-icons/io';
import { IoAdd, IoDocumentTextOutline, IoTimerOutline } from 'react-icons/io5';
import QRCode from 'qrcode';
import autoTable from 'jspdf-autotable';

type Props = {
	openFuncion?: () => void;
	openModalAddBarCode?: () => void;
	openModalAddEanPlu?: () => void;
	openModalAddUser?: () => void;
	addUser?: boolean;
	addValidade?: boolean;
	addBarCode?: boolean;
	addCodigo?: boolean;
};

export default function AddButton({
	openFuncion,
	openModalAddBarCode,
	openModalAddEanPlu,
	openModalAddUser,
	addUser = false,
	addBarCode = false,
	addValidade = false,
	addCodigo = false,
}: Props) {
	const { user } = useAuth();
	// Estado apenas para controlar o menu de PDF
	const [menuPdfAberto, setMenuPdfAberto] = useState(false);
	const { listaBruta } = useValidades();

	const gerarPdfValidadesMes = async (mesOffset = 0) => {
		if (!listaBruta || listaBruta.length === 0) {
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
		const produtosDoMes = listaBruta.filter((item) => {
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

		const colunas = ['QR Code - Plu', 'Produto', 'Marca', 'Vencimento'];

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
			item.marca_produto,
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
				1: { cellWidth: 'auto', valign: 'middle' },
				2: { cellWidth: 'auto', halign: 'left' },
				3: { cellWidth: 30, halign: 'center' },
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
	const handleGerarPdf = async (offset: number) => {
		//console.log('Gerando PDF com offset:', offset);
		await gerarPdfValidadesMes(offset);
		setMenuPdfAberto(false); // Fecha o menu após clicar
	};

	return (
		<div className='buttonAddContainer'>
			{/* --- SEU LAYOUT ANTIGO MANTIDO --- */}
			{[1, 3].includes(Number(user?.role)) && (
				<>
					{addUser && [1].includes(Number(user?.role)) && (
						<>
							<div
								className='botoes-adicionais buttonAdd buttonAddUser'
								title='Cadastrar Usuário'
								onClick={openModalAddUser}>
								<IoMdPersonAdd size={20} />
							</div>
							<div
								className='botoes-adicionais buttonAdd buttonAddCodeBar'
								title='Adicionar EAN/PLU'
								onClick={openModalAddEanPlu}>
								<IoMdBarcode size={20} />
							</div>
						</>
					)}

					{/* --- BOTÃO NOVO: Abre e fecha apenas as opções de PDF --- */}
					<div className='container-pdf-wrapper'>
						<div
							className='buttonAdd botoes-adicionais buttonAddUser'
							onClick={() => setMenuPdfAberto(!menuPdfAberto)}>
							<IoDocumentTextOutline size={20} />
						</div>

						{menuPdfAberto && (
							<div className='menu-bolinhas-esquerda'>
								<div className='bolinha' onClick={() => handleGerarPdf(0)}>
									Mês atual
								</div>
								<div className='bolinha' onClick={() => handleGerarPdf(1)}>
									Mês seguinte
								</div>
							</div>
						)}
					</div>
				</>
			)}

			{[1, 2, 3].includes(Number(user?.role)) && (
				<>
					{addBarCode ? (
						<div
							className='buttonAddValidade buttonAdd'
							onClick={openModalAddBarCode}>
							<IoTimerOutline size={30} />
						</div>
					) : (
						<div className='buttonAdd buttonAddIcon' onClick={openFuncion}>
							<IoAdd size={30} />
						</div>
					)}
				</>
			)}
		</div>
	);
}
