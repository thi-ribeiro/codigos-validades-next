"use client";

import { useConsulta } from "@/Contexto/ConsultaContext";
import { useEffect, useState } from "react";
import AutoComplete from "../AutoComplete/AutoComplete";

interface SimpleModalProps {
  tipo: "add" | "edit" | "remove" | null;
  dados?: any;
  children?: React.ReactNode;
}
export default function ModalCodigoProdutos({
  tipo,
  dados,
  onClose, // Adicione essa prop necessária!
}: SimpleModalProps & { onClose: () => void }) {
  // Não esqueça de tipar
  const {
    cadastroCodigoProduto,
    deletarProduto,
    editarCodigoProduto,
    loading,
  } = useConsulta();

  // 1. O modal só existe se 'tipo' existir.
  // Se 'tipo' for null, ele nem renderiza (if abaixo resolve tudo).
  useEffect(() => {
    if (tipo) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [tipo]);

  // Se 'tipo' é null, o modal some da tela instantaneamente
  if (!tipo) return null;

  return (
    <div className="modal-container">
      <div className="modal-backdrop" onClick={onClose}></div>
      <div className="modal-content">
        <button className="modal-close" onClick={onClose}>
          &times;
        </button>

        {tipo === "add" && (
          <div className="cadastroProdutos headerGenerico">
            <h1>Cadastrar Produto</h1>
            <form
              className="formProdutos"
              onSubmit={(e) => cadastroCodigoProduto(e, onClose)}
              method="POST"
            >
              <AutoComplete
                nameInput="nomeProduto"
                placeholder="Nome do Produto"
                nome={true}
              />
              <AutoComplete
                nameInput="marcaProduto"
                placeholder="Marca do Produto"
                marca={true}
              />

              <input
                name="codigoProduto"
                type="text"
                placeholder="Código do Produto"
              />
              <input
                type="submit"
                value={loading ? "Cadastrando..." : "Cadastrar Produto"}
                disabled={loading}
              />
            </form>
          </div>
        )}

        {tipo === "edit" && (
          <div className="editarCodigoProdutos headerGenerico">
            <h1> Editar código de produto </h1>
            <form
              className="formProdutos"
              onSubmit={(e) => editarCodigoProduto(e, onClose)}
              method="POST"
            >
              <input type="hidden" name="idProduto" value={dados?.id} />

              <AutoComplete
                nameInput="nomeProduto"
                placeholder="Nome do Produto"
                nome={true}
                valorPadrao={dados?.produto}
              />

              <AutoComplete
                nameInput="marcaProduto"
                placeholder="Marca do Produto"
                marca={true}
                valorPadrao={dados?.marca}
              />

              <input
                name="codigoProduto"
                type="text"
                placeholder="Código do Produto"
                defaultValue={dados?.codigo}
              />
              <div className="buttonsCodigoProdutos">
                <input
                  type="submit"
                  value="Finalizar edição"
                  disabled={loading}
                />
                <button onClick={onClose} name="cancelar">
                  Fechar
                </button>
              </div>
            </form>
          </div>
        )}

        {tipo === "remove" && (
          <div className="removerCodigoProdutos headerGenerico">
            <h1>Deletar produto</h1>
            <div className="removerCodigoProdutosContent">
              Deseja deletar o produto: {dados.produto} da marca {dados.marca}?
            </div>
            <div className="buttonsCodigoProdutos">
              <button
                name="deletar"
                onClick={() => deletarProduto(dados.id, onClose)}
                disabled={loading}
              >
                Deletar
              </button>
              <button onClick={onClose} name="fechar">
                Fechar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
