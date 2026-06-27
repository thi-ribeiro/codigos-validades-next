"use client";

import _ from "lodash";
import React, {
  createContext,
  JSX,
  ReactNode,
  useContext,
  useMemo,
  useState,
} from "react";
import { useAuth } from "./AuthContext";
import { useToast } from "./Toast";
//import { useBusca } from "./BuscaContext";

interface FuncoesProviderProps {
  children: ReactNode;
}

interface ValuesInterface {
  deletarProduto: (id: number, callbackSucesso: () => void) => Promise<void>; // Função para deletar um produto
  //fetchProds: (e?: React.SubmitEvent, prodName?: string) => Promise<void>; // Função para buscar produtos
  produto: Record<string, BuscaCodigosProdutos[]>;
  loading: boolean;
  //buscar: string;
  setBuscar: React.Dispatch<React.SetStateAction<string>>;
  modalState: boolean;
  setModalState: React.Dispatch<React.SetStateAction<boolean>>;
  formatarDataParaMySQL: (data: Date) => string;
  //limitaTexto: (texto: string, quantidade?: number) => React.JSX.Element;
  cadastroCodigo: (
    e: React.SubmitEvent<HTMLFormElement>,
    callbackSucesso: () => void,
  ) => Promise<void>;
  editarCodigo: (
    e: React.SubmitEvent<HTMLFormElement>,
    callbackSucesso: () => void,
  ) => Promise<void>;
  leftZeros: (num: string | number) => JSX.Element;
  //qntCodigosMarca: Record<string, number>;
  //TotalRegistros: number;
}

export interface BuscaCodigosProdutos {
  idcodigo: number;
  codigo_produto: number;
  nome_produto: string;
  marca_produto: string;
}

export interface MarcaProdutoInterface {
  marca_produto: string;
}

const acesso_fetch = process.env.NEXT_PUBLIC_API_URL;

const FuncoesContexto = createContext<ValuesInterface | undefined>(undefined);

export function FuncoesProvider({ children }: FuncoesProviderProps) {
  const { addToast } = useToast();
  const { logout } = useAuth();

  const [buscar, setBuscar] = useState(String);
  const [produto, setProduto] = useState<
    Record<string, BuscaCodigosProdutos[]>
  >({});

  const [loading, setLoading] = useState(false);
  const [modalState, setModalState] = useState(false);

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

  const formatarDataParaMySQL = (data: Date): string => {
    const pad = (num: number) => String(num).padStart(2, "0");

    const ano = data.getFullYear();
    const mes = pad(data.getMonth() + 1);
    const dia = pad(data.getDate());
    const horas = pad(data.getHours());
    const minutos = pad(data.getMinutes());
    const segundos = pad(data.getSeconds());

    return `${ano}-${mes}-${dia} ${horas}:${minutos}:${segundos}`;
  };

  const leftZeros = (num: string | number): JSX.Element => {
    let codigo = num.toString();

    if (codigo.length > 4) {
      return <span>{codigo}</span>;
    } else {
      return (
        <React.Fragment>
          <span style={{ color: "red" }}>0</span>
          {codigo}
        </React.Fragment>
      );
    }
  };

  const cadastroCodigo = async (
    e: React.SubmitEvent<HTMLFormElement>,
    callbackSucesso: () => void,
  ) => {
    //setLoading(true);

    e.preventDefault();

    const formData = new FormData(e.currentTarget);
    const nomeProduto = (formData.get("nomeProduto") as string).trim();
    const marcaProduto = (formData.get("marcaProduto") as string).trim();
    const codigoProduto = (formData.get("codigoProduto") as string).trim();
    //const idProduto = (formData.get('idProduto') as string).trim();

    const produto = {
      adicionarProduto: true, // Indicador para o backend que é um cadastro de produto
      nomeProduto: nomeProduto,
      marcaProduto: marcaProduto,
      codigoProduto: codigoProduto,
      responsavelCadastro: "Thiago", // Substitua pelo nome do responsável ou
    };

    if (!checkCampos(nomeProduto, marcaProduto, codigoProduto)) {
      return;
    }

    //const acesso_fetch = process.env.NEXT_PUBLIC_API_URL;

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
        logout();
        return;
      }

      const responseData = await response.json();

      if (responseData?.auth === false) {
        //setLoading(false); // Desativa o loading antes de sair
        //console.log('Thiago auth Falhou!');
        logout();
        return;
      }

      if (!responseData.info) {
        addToast(responseData.message, "error");
        //setLoading(false);
      } else {
        addToast(responseData.message, "success");
        //fetchProds();
        //setLoading(false);
        callbackSucesso();
      }
    } catch (error) {
      console.error("Error:", error);
      return;
    }
  };

  const editarCodigo = async (
    e: React.SubmitEvent<HTMLFormElement>,
    callbackSucesso: () => void,
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
      responsavelCadastro: "Thiago", // Substitua pelo nome do responsável ou
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
        //credentials: 'include', // Necessário para enviar o cookie de autenticação
      });

      if (!response.ok || response.status === 401) {
        //throw new Error('Erro ao cadastrar produto.');
        logout();
        return;
      }

      const responseData = await response.json();

      if (responseData.status === "info") {
        addToast(responseData.message, responseData.status);
        //setLoading(false);
      } else {
        addToast(responseData.message, responseData.status);
        //fetchProds();
        //setLoading(false);
        callbackSucesso();
      }
    } catch (error) {
      console.error("Error:", error);
      return;
    }
  };

  const deletarProduto = async (id: number, callbackSucesso: () => void) => {
    try {
      const response = await fetch(`${acesso_fetch}/remover`, {
        //method: 'DELETE', //FIX PARA UTILIZAR NO INFINITY FREE
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // Se seu backend usa cookies (como o JWT que configuramos)
        body: JSON.stringify({ idProduto: id }),
      });

      const resposta = await response.json();

      if (!response.ok) {
        addToast(resposta.message, resposta.status);
      }
      addToast(resposta.message, resposta.status);
      //fetchProds(undefined, buscar); // Recarrega os produtos após a exclusão

      callbackSucesso();
    } catch (error) {
      console.error("Erro ao deletar o produto:", error);
      throw error;
    }
    // }
  };

  const contextValues: ValuesInterface = {
    deletarProduto,
    produto,
    loading,
    setBuscar,
    formatarDataParaMySQL,
    modalState,
    setModalState,
    cadastroCodigo,
    editarCodigo,
    leftZeros,
  };

  return (
    <FuncoesContexto.Provider value={contextValues}>
      {children}
    </FuncoesContexto.Provider>
  );
}

export const useFuncoes = () => {
  const context = useContext(FuncoesContexto);
  if (context === undefined) {
    throw new Error("Deve ser usado dentro do funcoescontexto.");
  }
  return context;
};
