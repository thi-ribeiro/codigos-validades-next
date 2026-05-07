import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './styles/globals.css';
import { AuthProvider } from '@/Contexto/AuthContext';
import UserLoginMenuFunctions from '../Componentes/UserLoginMenuFunctions/UserLoginMenuFunctions';
import React from 'react';
import { ToastProvider } from '@/Contexto/Toast';

const geistSans = Geist({
	variable: '--font-geist-sans',
	subsets: ['latin'],
});

const geistMono = Geist_Mono({
	variable: '--font-geist-mono',
	subsets: ['latin'],
});

export const metadata: Metadata = {
	title: 'Ceres I - Gestão de Validades',
	description: 'Controle de validades e códigos de produtos - Thiago',
	manifest: '/manifest.json',
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang='pt-BR'>
			<body className={`${geistSans.variable} ${geistMono.variable}`}>
				<ToastProvider>
					<AuthProvider>
						<UserLoginMenuFunctions />
						{children}
					</AuthProvider>
				</ToastProvider>
			</body>
		</html>
	);
}
