// import { NextRequest } from 'next/server';
// import { msgBus } from './events';

// export async function GET(req: NextRequest) {
// 	const encoder = new TextEncoder();

// 	const stream = new ReadableStream({
// 		start(controller) {
// 			const enviarMensagem = () => {
// 				const msg = `data: ${JSON.stringify({ action: 'refresh' })}\n\n`;
// 				controller.enqueue(encoder.encode(msg));
// 			};

// 			// Escuta o rádio global
// 			msgBus.on('atualizou', enviarMensagem);

// 			req.signal.onabort = () => {
// 				msgBus.off('atualizou', enviarMensagem);
// 				controller.close();
// 			};
// 		},
// 	});

// 	return new Response(stream, {
// 		headers: {
// 			'Content-Type': 'text/event-stream',
// 			'Cache-Control': 'no-cache',
// 			'Connection': 'keep-alive',
// 		},
// 	});
// }