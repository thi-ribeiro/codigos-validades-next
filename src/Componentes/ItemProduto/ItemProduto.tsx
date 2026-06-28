import React, { JSX } from "react";
import { IoIosSwap } from "react-icons/io";
import { IoRemoveCircleOutline } from "react-icons/io5";

interface ItemProdutoProps {
  p: any;
  userEdit: boolean;
  onEdit: (p: any) => void;
  onDelete: (p: any) => void;
}

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

export const ItemProduto = React.memo(
  ({ p, userEdit, onEdit, onDelete }: ItemProdutoProps) => {
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
