"use client";

import { useContext, useState, createContext, useEffect } from "react";

interface Values {
  termoBusca: string;
  setTermoBusca: React.Dispatch<React.SetStateAction<string>>;
  debouncedTermo: string;
}

const BuscaContext = createContext<Values | undefined>(undefined);

export const BuscaProvider = ({ children }: { children: React.ReactNode }) => {
  const [termoBusca, setTermoBusca] = useState(""); // O que o usuário digita
  const [debouncedTermo, setDebouncedTermo] = useState(""); // O termo filtrado final

  // O useEffect vive aqui dentro, centralizado
  useEffect(() => {
    if (termoBusca.length >= 3 || termoBusca === "") {
      const handler = setTimeout(() => {
        setDebouncedTermo(termoBusca);
      }, 800);

      console.log("ta digitando no contexto de busca! que lag?");

      return () => clearTimeout(handler);
    }
  }, [termoBusca]);

  const contextValues: Values = {
    termoBusca,
    setTermoBusca,
    debouncedTermo,
  };

  return (
    <BuscaContext.Provider value={contextValues}>
      {children}
    </BuscaContext.Provider>
  );
};

export const useBusca = () => {
  const context = useContext(BuscaContext);
  if (context === undefined) {
    throw new Error("Deve ser usado dentro do provider principal de busca.");
  }
  return context;
};
