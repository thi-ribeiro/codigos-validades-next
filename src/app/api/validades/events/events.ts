// import { EventEmitter } from 'events';

// // Configuração para garantir que o rádio seja global no Next.js
// const globalForEvents = global as unknown as { msgBus: EventEmitter };

// // Exportação NOMEADA (Isso resolve o erro "doesn't exist")
// export const msgBus = globalForEvents.msgBus || new EventEmitter();

// if (process.env.NODE_ENV !== 'production') {
//     globalForEvents.msgBus = msgBus;
// }