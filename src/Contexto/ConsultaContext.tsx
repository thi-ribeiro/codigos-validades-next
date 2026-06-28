"use client";

import _ from "lodash";
import React, {
  createContext,
  useContext,
  useState,
  useMemo,
  JSX,
} from "react";

import { useToast } from "./Toast";
import { useAuth } from "./AuthContext";

// Tipagem dos seus dados
interface ConsultaContextData {
  fetchProdutos: (e?: React.SubmitEvent, prodName?: string) => Promise<void>;
  deletarProduto: (id: number, onClose: () => void) => void;
  editarCodigoProduto: (
    e: React.SyntheticEvent<HTMLFormElement>,
    onClose: () => void,
  ) => Promise<void>;
  cadastroCodigoProduto: (
    e: React.SyntheticEvent<HTMLFormElement>,
    onClose: () => void,
  ) => Promise<void>;
  loading: boolean;
  textoBusca: string;
  setTextoBusca: React.Dispatch<React.SetStateAction<string>>;
  produtosFiltrados: Record<string, BuscaCodigosProdutos[]>;
}

interface ProdutoDetails {
  id: number;
  produto: string;
  marca: string;
  codigo?: number;
}

interface BuscaCodigosProdutos {
  idcodigo: number;
  codigo_produto: number;
  nome_produto: string;
  marca_produto: string;
}

const ConsultaContext = createContext({} as ConsultaContextData);

const acesso_fetch = process.env.NEXT_PUBLIC_API_URL;

export function ConsultaProvider({ children }: { children: React.ReactNode }) {
  const { addToast } = useToast();
  const { logout } = useAuth();

  const [produto, setProduto] = useState<
    Record<string, BuscaCodigosProdutos[]>
  >({});
  const [loading, setLoading] = useState(false);
  const [totalRegistros, setTotalRegistros] = useState(Number);
  const [textoBusca, setTextoBusca] = useState(String);

  const checkCampos = (
    nomeProduto: string,
    marcaProduto: string,
    codigoProduto: string,
  ): boolean => {
    if (
      !nomeProduto ||
      !marcaProduto ||
      !codigoProduto ||
      marcaProduto.length < 3
    ) {
      addToast("Por favor, preencha todos os campos!", "error");
      return false;
    }

    return true;
  };

  const fetchProdutos = async () => {
    try {
      setLoading(true);
      setProduto({});
      setTotalRegistros(0);

      const response = await fetch(
        // `${acesso_fetch}/consulta?consultaProdutoBusca`,
        `${acesso_fetch}/consulta`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          cache: "no-cache",
          credentials: "include", //ADICIONADO PARA TENTAR FIX 27/12
        },
      );

      if (!response.ok) {
        //throw new Error("Network response was not ok");
        addToast("Erro ao buscar produtos.", "error");
        setLoading(false);
        return;
      }
      const data = await response.json();

      // Verificação de segurança adicional
      if (data && data.dados) {
        const produtosAgrupados = _.groupBy(data.dados, "marca_produto");
        setProduto(produtosAgrupados);
        setTotalRegistros(data.dados.length); // Opcional: Descomente se quiser usar
      } else {
        setProduto({});
        addToast("Nenhum produto encontrado ou formato inválido.", "error");
      }
      setLoading(false);
    } catch (error) {
      console.error("Fetch error:", error);
      //addToast(`Erro ao buscar produtos: ${error}`, "error");
      setLoading(false);
    }
  };

  const deletarProduto = async (id: number, onClose: () => void) => {
    try {
      const response = await fetch(`${acesso_fetch}/remover`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ idProduto: id }),
      });

      const resposta = await response.json();

      addToast(resposta.message, resposta.status);
      onClose();
      fetchProdutos();
    } catch (error) {
      addToast("Error:", "error");
      throw error;
    }
  };

  const cadastroCodigoProduto = async (
    e: React.SyntheticEvent<HTMLFormElement>,
    onClose: () => void,
  ) => {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);
    const nomeProduto = (formData.get("nomeProduto") as string).trim();
    const marcaProduto = (formData.get("marcaProduto") as string).trim();
    const codigoProduto = (formData.get("codigoProduto") as string).trim();

    const produto = {
      adicionarProduto: true, // Indicador para o backend que é um cadastro de produto
      nomeProduto: nomeProduto,
      marcaProduto: marcaProduto,
      codigoProduto: codigoProduto,
      responsavelCadastro: "Thiago",
    };

    if (!checkCampos(nomeProduto, marcaProduto, codigoProduto)) {
      return;
    }

    try {
      const response = await fetch(`${acesso_fetch}/add`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(produto),
        credentials: "include", // Necessário para enviar o cookie de autenticação
      });

      if (!response.ok || response.status === 401) {
        //throw new Error('Erro ao cadastrar produto.');
        //logout();
        return;
      }

      const responseData = await response.json();

      if (responseData?.auth === false) {
        logout();
        return;
      }

      addToast(responseData.message, responseData.status);

      if (responseData.status === "success") {
        fetchProdutos();
        onClose();
      }
    } catch (error) {
      addToast("Error:", "error");
      return;
    }
  };

  const editarCodigoProduto = async (
    e: React.SyntheticEvent<HTMLFormElement>,
    onClose: () => void,
  ) => {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);

    const nomeProduto = (formData.get("nomeProduto") as string).trim();
    const marcaProduto = (formData.get("marcaProduto") as string).trim();
    const codigoProduto = (formData.get("codigoProduto") as string).trim();
    const idProduto = (formData.get("idProduto") as string).trim();

    const produto = {
      editarCodigoProduto: true, // Indicador para o backend que é um cadastro de produto
      idProduto: idProduto,
      nomeProduto: nomeProduto,
      marcaProduto: marcaProduto,
      codigoProduto: codigoProduto,
      responsavelCadastro: "Thiago",
    };

    if (!checkCampos(nomeProduto, marcaProduto, codigoProduto)) {
      return;
    }

    try {
      const response = await fetch(`${acesso_fetch}/editar`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(produto),
      });

      if (!response.ok || response.status === 401) {
        //throw new Error('Erro ao cadastrar produto.');
        return;
      }

      const responseData = await response.json();

      addToast(responseData.message, responseData.status);
      onClose();
      fetchProdutos();
    } catch (error) {
      addToast("Error:", "error");
      return;
    }
  };

  const todosOsProdutos = useMemo(() => {
    if (!produto || typeof produto !== "object") return [];
    return Object.values(produto).flat();
  }, [produto]); // Só recalcula se a API trouxer dados novos

  const produtosFiltrados = useMemo(() => {
    // Filtra
    const filtrados = todosOsProdutos.filter((item) =>
      item.nome_produto.toLowerCase().includes(textoBusca.toLowerCase().trim()),
    );

    // Agrupa de volta por marca
    return _.groupBy(filtrados, "marca_produto");
  }, [todosOsProdutos, textoBusca]);

  // O "pulo do gato": useMemo garante que o objeto value só é recriado
  // se 'produto' ou 'loading' mudarem.
  const value = useMemo(
    () => ({
      loading,
      fetchProdutos,
      deletarProduto,
      editarCodigoProduto,
      cadastroCodigoProduto,
      textoBusca,
      setTextoBusca,
      produtosFiltrados,
    }),
    [produto, loading, fetchProdutos, deletarProduto],
  );

  return (
    <ConsultaContext.Provider value={value}>
      {children}
    </ConsultaContext.Provider>
  );
}

export const useConsulta = () => useContext(ConsultaContext);
