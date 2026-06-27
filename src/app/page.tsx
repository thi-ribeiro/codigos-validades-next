"use client";

import React, { useCallback, useEffect, useState } from "react";
import _ from "lodash";
import { IoRemoveCircleOutline } from "react-icons/io5";
import { useAuth } from "@/Contexto/AuthContext";
import Modal from "@/Componentes/ModalCodigoProdutos/Modal";
import AddButton from "@/Componentes/AddButton/AddButton";
import { IoIosSwap } from "react-icons/io";
import LoadingLogo from "@/Componentes/LoadingLogo/LoadingLogo";
import { ConsultaProvider, useConsulta } from "@/Contexto/ConsultaContext";

export interface Props {}

export default function page() {
  return (
    <ConsultaProvider>
      <Pagina />
    </ConsultaProvider>
  );
}

const ItemProduto = React.memo(
  ({ p, userEdit, leftZeros, onEdit, onDelete }: any) => {
    return (
      <div className="produtosItems">
        <div className="info-produto-col">
          <span className="nome-prod-label">{p.nome_produto}</span>
          <span className="codigo-prod-label">
            {leftZeros(p.codigo_produto)}
          </span>
        </div>

        {userEdit && (
          <div className="acoes-produto-row">
            <IoIosSwap size={20} onClick={() => onEdit(p)} />
            <IoRemoveCircleOutline size={20} onClick={() => onDelete(p)} />
          </div>
        )}
      </div>
    );
  },
);

function Pagina({}: Props) {
  interface ProdutoDetails {
    id: number;
    produto: string;
    marca: string;
    codigo?: number;
  }

  const { user } = useAuth();

  const {
    loading,
    fetchProdutos,
    deletarProduto,
    textoBusca,
    setTextoBusca,
    produtosFiltrados,
    leftZeros,
  } = useConsulta();

  const [produtoSelected, setprodutoSelected] = useState<ProdutoDetails>({
    id: 0,
    produto: "",
    marca: "",
    codigo: 0,
  });

  const [tipoModal, setTipoModal] = useState<"add" | "edit" | "remove" | null>(
    null,
  );

  useEffect(() => {
    fetchProdutos();
  }, []);

  const usuarioEditor = user?.role === 1;

  // Use useCallback para que a função NUNCA mude a menos que suas dependências mudem
  const handleEdit = useCallback((p: any) => {
    setprodutoSelected({
      id: p.idcodigo,
      produto: p.nome_produto,
      marca: p.marca_produto,
      codigo: p.codigo_produto,
    });
    setTipoModal("edit");
  }, []); // Array de dependências vazio se não usar variáveis externas aqui dentro

  const handleDelete = useCallback((p: any) => {
    setprodutoSelected({
      id: p.idcodigo,
      produto: p.nome_produto,
      marca: p.marca_produto,
      codigo: p.codigo_produto,
    });
    setTipoModal("remove");
  }, []);

  return (
    <React.Fragment>
      <div className="buscarHeader">
        <h1>Consulta de Produtos</h1>
        <div className="formBuscarProdutos">
          <input
            type="text"
            placeholder="Buscar por Produto ou Marca"
            value={textoBusca}
            onChange={(e) => setTextoBusca(e.target.value)}
          />
          {Object.keys(produtosFiltrados).length > 0 && (
            <div className="totalRegistros">
              Total marca(s): {Object.keys(produtosFiltrados).length}&nbsp;
              {" - "}
              <span className="qntCodigosSpan">
                &nbsp;{" "}
                {Object.values(produtosFiltrados).reduce(
                  (acc, curr) => acc + curr.length,
                  0,
                )}
                &nbsp; código(s)
              </span>
            </div>
          )}
        </div>
      </div>

      <LoadingLogo
        loading={loading}
        mensagem="Carregando lista de códigos..."
      />

      <div className="produtosBusca">
        {produtosFiltrados &&
          Object.keys(produtosFiltrados).map((marca, id) => (
            <div key={marca} className="produtosItemsMarca">
              <div className="marcaDiv">
                <h2>{marca || "Verificar marca"}</h2>
                <span className="qntCodigosSpan">
                  {produtosFiltrados[marca].length} Código(s)
                </span>
              </div>
              {produtosFiltrados[marca].map((p) => (
                <ItemProduto
                  key={p.idcodigo}
                  p={p}
                  userEdit={usuarioEditor}
                  leftZeros={leftZeros}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          ))}
      </div>

      <AddButton
        openFuncion={() => {
          setTipoModal("add");
        }}
        addCodigo={true}
      />
      <Modal
        tipo={tipoModal}
        dados={produtoSelected}
        onClose={() => setTipoModal(null)}
      />
    </React.Fragment>
  );
}
