'use client';

import React, { useContext, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

export interface ValuesInterface {
	addToast: (
		message: string,
		type?: 'success' | 'error' | 'info',
		timerMs?: number
	) => void;
}

interface ToastMessage {
	id: number;
	message: string;
	type: 'success' | 'error' | 'info';
}

export interface ToastProviderProps {
	children: React.ReactNode;
}

export interface ContextValuesInterface {
	addToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

const ToastContext = React.createContext<ValuesInterface | undefined>(
	undefined
);

export const ToastProvider = ({ children }: ToastProviderProps) => {
	const [toasts, setToasts] = useState<ToastMessage[]>([]);

	const addToast = (
		message: string,
		type: ToastMessage['type'] = 'info',
		timerMs = 3000
	) => {
		//Adiciono a funcao de chamar, que passa a mensagem e o tipo padrao
		//tTodo toast vai ser de uma instancia unica
		const newToast = { id: Date.now(), message, type };
		//Cria um objeto que representa a mensagem atual
		setToasts((currentToasts) => [...currentToasts, newToast]);
		//Adiciona ele ao array com as informações
		// Remove o toast após o valor definido
		setTimeout(() => {
			setToasts(
				(currentToasts) =>
					currentToasts.filter((toast) => toast.id !== newToast.id)
				//cada uma tem um id diferente ao entrar no array
				//ele vai dando timeout de acordo com a criação
			);
		}, timerMs);
	};

	const contextValues: ContextValuesInterface = {
		addToast,
	};

	return (
		<ToastContext.Provider value={contextValues}>
			{children}
			<div className='toast-container'>
				<AnimatePresence>
					{toasts.map((toast) => (
						<motion.div
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
							transition={{ duration: 1.0 }}
							key={toast.id}
							className={`toast ${toast.type}`}>
							{toast.message}
						</motion.div>
					))}
				</AnimatePresence>
			</div>
		</ToastContext.Provider>
	);
};

export const useToast = () => {
	const context = useContext(ToastContext);
	if (context === undefined) {
		throw new Error('useToast Deve der usado dentro de toastProvider.');
	}
	return context;
};
