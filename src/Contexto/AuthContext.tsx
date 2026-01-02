'use client'; // Esta linha é crucial para que o Next.js saiba que é um Client Component

import {
	createContext,
	useContext,
	useState,
	useEffect,
	ReactNode,
} from 'react';
import { useRouter } from 'next/navigation'; // Para redirecionar o usuário, se necessário

// 1. Definição da interface para os dados do usuário no Context
interface UserData {
	uid: number;
	usuario: string;
	role: number | string; // Mapeia de nivel_acesso
	email: string | null;
	status: string;
	auth: boolean;
	message: string;
	empresa: string;
}

// 2. Definição da interface para o próprio Context (o que ele vai prover)
interface AuthContextType {
	user: UserData | null; // Dados do usuário logado, ou null se não logado
	isLoading: boolean; // Indica se está carregando os dados de autenticação
	error: string | null; // Mensagem de erro, se houver
	login: (userData: UserData) => void; // Função para atualizar os dados do usuário após o login
	logout: () => void; // Função para deslogar o usuário (limpar dados e cookie)
}

// 3. Criação do Context
// createContext<AuthContextType | undefined>(undefined) define que o valor inicial é undefined
// e que o Context proverá um objeto do tipo AuthContextType (ou undefined antes de ser usado em um Provider)
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 4. Props para o componente AuthProvider
interface AuthProviderProps {
	children: ReactNode; // 'children' é uma propriedade padrão para componentes que envolvem outros
}

const acesso_auth = process.env.NEXT_PUBLIC_AUTH_API;

// 5. O Componente AuthProvider
// Este é o componente que você vai usar para envolver sua aplicação (ou partes dela)
export function AuthProvider({ children }: AuthProviderProps) {
	const [user, setUser] = useState<UserData | null>(null);
	const [isLoading, setIsLoading] = useState(true); // Começa como true para indicar que está verificando a autenticação
	const [error, setError] = useState<string | null>(null);
	const router = useRouter(); // Instancia o roteador para poder redirecionar

	// Função assíncrona para buscar os dados do usuário do backend PHP
	const fetchUserData = async () => {
		setIsLoading(true); // Define loading para true antes de iniciar a busca
		setError(null); // Limpa qualquer erro anterior
		try {
			// Use process.env.NEXT_PUBLIC_API_URL, que deve ser definido no seu arquivo .env.local
			const response = await fetch(`${acesso_auth}`, {
				// OU um endpoint específico como /verify-auth.php
				method: 'POST', // Ou GET, dependendo de como você configura a verificação
				headers: {
					'Content-Type': 'application/json',
				},
				//body: JSON.stringify({ verifyAuth: true }), // Um indicador para o backend verificar o token
				//credentials: 'include', // Necessário se seu frontend e backend estiverem em subdomínios diferentes (ex: app.site.com e api.site.com)
			});

			const data = await response.json(); // Converte a resposta para JSON

			//console.log(response);

			if (response.status === 401) {
				setUser(null); // Se o status for 401, significa que o usuário não está autenticado
				setError('Usuário não autenticado. Por favor, faça login.');
				return;
			}

			if (!response.ok) {
				// Se a resposta HTTP não for bem-sucedida (ex: 401, 500)
				const errorData = await response.json(); // Tenta ler a mensagem de erro do corpo da resposta

				console.log(errorData);
				throw new Error(
					errorData.message || 'Falha ao buscar dados do usuário.'
				);
			}

			if (data.auth === true) {
				setUser(data.user); // Define os dados do usuário no estado
			} else {
				// Se o PHP indicou falha na autenticação (mesmo com status 200)
				setUser(null); // Limpa os dados do usuário
				setError(data.message || 'Autenticação falhou.');
				//router.push('/login'); // Redireciona para a página de login
			}
		} catch (err: any) {
			// Captura erros de rede ou de processamento da requisição
			setUser(null); // Limpa os dados do usuário em caso de erro
			setError(err.message); // Define a mensagem de erro
			console.error('Erro ao buscar dados do usuário:', err);
			//router.push('/login'); // Redireciona em caso de erro grave (ex: servidor fora do ar)
		} finally {
			setIsLoading(false); // Define loading para false após a conclusão (sucesso ou erro)
		}
	};

	useEffect(() => {
		const checkUser = async () => {
			setIsLoading(true); // Garante que começa carregando
			try {
				const res = await fetch(`${acesso_auth}/me`);
				if (res.ok) {
					const userData = await res.json();
					// O JSON que você postou antes tinha os dados na raiz,
					// ou dentro de .user? Ajuste conforme o console.log
					setUser(userData.user || userData);
				} else {
					setUser(null);
				}
			} catch (error) {
				console.error('Erro na verificação:', error);
				setUser(null);
			} finally {
				setIsLoading(false); // ESSA LINHA É A CHAVE: Libera a renderização
			}
		};

		checkUser();
	}, []);

	// Função `login` para ser usada após um login bem-sucedido (ex: na sua página de login)
	const login = (userData: UserData) => {
		setUser(userData); // Atualiza o estado do usuário diretamente
		setIsLoading(false); // Define loading como false após o login
	};

	// Função `logout` para ser usada quando o usuário decide sair
	const logout = async () => {
		setIsLoading(true); // Indica que o sistema está processando a saída
		try {
			// Chama a nossa nova API de logout
			await fetch(`${acesso_auth}/logout`, { method: 'POST' });

			// Limpa os dados no Front-end
			setUser(null);
			setError(null);

			// Redireciona para o login
			router.push('/login');
		} catch (err) {
			console.error('Erro ao deslogar:', err);
			setError('Erro ao encerrar a sessão.');
		} finally {
			setIsLoading(false);
		}
	};

	// O valor que será provido para todos os componentes filhos
	const contextValue: AuthContextType = {
		user,
		isLoading,
		error,
		login,
		logout,
	};

	return (
		// O AuthContext.Provider envolve os 'children' e passa o 'contextValue' para eles
		<AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
	);
}

// 6. Hook personalizado para facilitar o consumo do Context em outros componentes
// Este hook verifica se o Context está sendo usado dentro de um AuthProvider
export const useAuth = () => {
	const context = useContext(AuthContext);
	if (context === undefined) {
		throw new Error('useAuth deve ser usado dentro de um AuthProvider.');
	}
	return context;
};
