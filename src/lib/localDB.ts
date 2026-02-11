import type {
  Cliente,
  Veiculo,
  OrdemServico,
  OSChecklist,
  OSItem,
  OSFoto,
  OSTimeline,
  StatusOS,
} from "../types";

type LocalUser = { id: string; email: string };

type DB = {
  users: LocalUser[];
  clientes: Cliente[];
  veiculos: Veiculo[];
  ordens_servico: OrdemServico[];
  os_checklist: OSChecklist[];
  os_itens: OSItem[];
  os_fotos: OSFoto[];
  os_timeline: OSTimeline[];
  counters: Record<string, number>;
};

const STORAGE_KEY = "oficina_pro_db_v1";

function nowIso() {
  return new Date().toISOString();
}

function uuid() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return "id_" + Math.random().toString(16).slice(2) + Date.now().toString(16);
}

function loadDB(): DB {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) return JSON.parse(raw) as DB;

  const seed: DB = {
    users: [{ id: "demo-user", email: "demo@oficina.com" }],
    clientes: [],
    veiculos: [],
    ordens_servico: [],
    os_checklist: [],
    os_itens: [],
    os_fotos: [],
    os_timeline: [],
    counters: { "demo-user": 0 },
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
  return seed;
}

function saveDB(db: DB) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
}

export const localDb = {
  // =========================
  // Auth (simples)
  // =========================
  signUp(email: string, _password: string) {
    const db = loadDB();
    const exists = db.users.some(
      (u) => u.email.toLowerCase() === email.toLowerCase(),
    );
    if (exists) throw new Error("Este e-mail já está cadastrado.");

    const user: LocalUser = { id: uuid(), email };
    db.users.push(user);
    db.counters[user.id] = 0;
    saveDB(db);
    return user;
  },

  signIn(email: string, _password: string) {
    const db = loadDB();
    const user = db.users.find(
      (u) => u.email.toLowerCase() === email.toLowerCase(),
    );
    if (!user) throw new Error("Usuário não encontrado.");
    return user;
  },

  // =========================
  // Clientes
  // =========================
  listClientes() {
    const db = loadDB();
    return [...db.clientes].sort((a, b) => a.nome.localeCompare(b.nome));
  },

  createCliente(input: {
    nome: string;
    telefone: string;
    email?: string | null;
    user_id: string;
  }): Cliente {
    const db = loadDB();
    const created_at = nowIso();

    const cliente: Cliente = {
      id: uuid(),
      nome: input.nome,
      telefone: input.telefone,
      email: input.email ?? undefined,
      created_at,
      updated_at: created_at,
      user_id: input.user_id,
    } as Cliente;

    db.clientes.push(cliente);
    saveDB(db);
    return cliente;
  },

  // =========================
  // Veículos
  // =========================
  createVeiculo(input: {
    cliente_id: string;
    placa: string;
    marca: string;
    modelo: string;
    ano?: number | null;
    cor?: string | null;
    user_id: string;
  }): Veiculo {
    const db = loadDB();
    const created_at = nowIso();

    const veiculo: Veiculo = {
      id: uuid(),
      cliente_id: input.cliente_id,
      placa: input.placa,
      marca: input.marca,
      modelo: input.modelo,
      ano: input.ano ?? undefined,
      cor: input.cor ?? undefined,
      created_at,
      user_id: input.user_id,
    } as Veiculo;

    db.veiculos.push(veiculo);
    saveDB(db);
    return veiculo;
  },

  // =========================
  // OS
  // =========================
  listOS(): OrdemServico[] {
    const db = loadDB();
    const clientesById = new Map(db.clientes.map((c) => [c.id, c]));
    const veiculosById = new Map(db.veiculos.map((v) => [v.id, v]));

    return [...db.ordens_servico]
      .sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
      .map((os) => ({
        ...os,
        cliente: clientesById.get(os.cliente_id),
        veiculo: veiculosById.get(os.veiculo_id),
      })) as OrdemServico[];
  },

  createOS(input: {
    cliente_id: string;
    veiculo_id: string;
    problema_relatado: string;
    km: number;
    combustivel: number;
    previsao_entrega?: string | null;
    user_id: string;
  }): OrdemServico {
    const db = loadDB();
    const created_at = nowIso();

    const current = db.counters[input.user_id] ?? 0;
    const numero = current + 1;
    db.counters[input.user_id] = numero;

    const os: OrdemServico = {
      id: uuid(),
      numero,
      cliente_id: input.cliente_id,
      veiculo_id: input.veiculo_id,
      status: "aberta" as StatusOS,
      problema_relatado: input.problema_relatado,
      km: input.km,
      combustivel: input.combustivel,
      valor_total: 0,
      previsao_entrega: input.previsao_entrega ?? undefined,
      data_entrada: created_at,
      created_at,
      updated_at: created_at,
      user_id: input.user_id,
    } as OrdemServico;

    // campos extras (local)
    os.mao_de_obra = 0;
    os.paid_at = null;
    os.data_conclusao = null;

    db.ordens_servico.push(os);
    saveDB(db);
    return os;
  },

  insertChecklist(
    items: Array<{
      os_id: string;
      item: string;
      checked: boolean;
      ordem: number;
    }>,
  ) {
    const db = loadDB();
    const created_at = nowIso();

    items.forEach((i) => {
      const row: OSChecklist = {
        id: uuid(),
        os_id: i.os_id,
        item: i.item,
        checked: i.checked,
        ordem: i.ordem,
        created_at,
      } as OSChecklist;

      db.os_checklist.push(row);
    });

    saveDB(db);
  },

  // =========================
  // Status / Pagamento
  // =========================
  setOSStatus(input: {
    os_id: string;
    status:
      | "aberta"
      | "em_andamento"
      | "aguardando_peca"
      | "concluida"
      | "entregue";
    user_id?: string;
  }) {
    const db = loadDB();
    const os = db.ordens_servico.find((o) => o.id === input.os_id);
    if (!os) throw new Error("OS não encontrada.");

    const prev = os.status;

    os.status = input.status;
    os.updated_at = nowIso();

    // Se marcou como concluída = recebeu o dinheiro
    if (input.status === "concluida") {
      os.paid_at = os.paid_at ?? nowIso();
      os.data_conclusao = os.data_conclusao ?? nowIso();
    }

    // Se marcou entregue, não mexe no valor, só registra evento
    if (input.status === "entregue") {
      os.delivered_at = os.delivered_at ?? nowIso();
      // (opcional) se entregou e ainda não marcou pagamento, marca
      os.paid_at = os.paid_at ?? nowIso();
      os.data_conclusao = os.data_conclusao ?? nowIso();
    }

    db.os_timeline.push({
      id: uuid(),
      os_id: input.os_id,
      evento: `Status alterado: ${String(prev ?? "")} → ${input.status}`,
      created_at: nowIso(),
      user_id: input.user_id,
    });

    saveDB(db);
    return input.status;
  },

  // =========================
  // Mão de obra
  // =========================
  setMaoDeObra(input: { os_id: string; valor: number; user_id?: string }) {
    const db = loadDB();
    const os = db.ordens_servico.find((o) => o.id === input.os_id);
    if (!os) throw new Error("OS não encontrada.");

    const mao = Number(input.valor.toFixed(2));
    os.mao_de_obra = mao;

    const totalItens = db.os_itens
      .filter((i) => i.os_id === input.os_id)
      .reduce((sum, i) => sum + Number(i.valor_total ?? 0), 0);

    os.valor_total = Number((totalItens + mao).toFixed(2));
    os.updated_at = nowIso();

    db.os_timeline.push({
      id: uuid(),
      os_id: input.os_id,
      evento: `Mão de obra atualizada: R$ ${mao.toFixed(2)}`,
      created_at: nowIso(),
      user_id: input.user_id,
    });

    saveDB(db);
    return mao;
  },

  // =========================
  // Itens / Preços
  // =========================
  addOSItem(input: {
    os_id: string;
    tipo: "servico" | "peca";
    descricao: string;
    quantidade: number;
    valor_unitario: number;
    user_id?: string;
  }) {
    const db = loadDB();
    const os = db.ordens_servico.find((o) => o.id === input.os_id);
    if (!os) throw new Error("OS não encontrada.");

    const created_at = nowIso();
    const valor_total = Number(
      (input.quantidade * input.valor_unitario).toFixed(2),
    );

    const item: OSItem = {
      id: uuid(),
      os_id: input.os_id,
      tipo: input.tipo,
      descricao: input.descricao,
      quantidade: input.quantidade,
      valor_unitario: Number(input.valor_unitario.toFixed(2)),
      valor_total,
      created_at,
    } as OSItem;

    db.os_itens.push(item);

    const totalItens = db.os_itens
      .filter((i) => i.os_id === input.os_id)
      .reduce((sum, i) => sum + Number(i.valor_total), 0);

    const mao = Number(os.mao_de_obra ?? 0);

    os.valor_total = Number((totalItens + mao).toFixed(2));
    os.updated_at = nowIso();

    db.os_timeline.push({
      id: uuid(),
      os_id: input.os_id,
      evento: `Item adicionado: ${input.descricao}`,
      created_at: nowIso(),
      user_id: input.user_id,
    });

    saveDB(db);
    return item;
  },

  // =========================
  // Remover itens / Recalcular
  // =========================
  removeOSItem(input: { item_id: string; user_id?: string }) {
    const db = loadDB();
    const idx = db.os_itens.findIndex((i) => i.id === input.item_id);
    if (idx === -1) throw new Error("Item não encontrado.");

    const item = db.os_itens[idx];
    const os = db.ordens_servico.find((o) => o.id === item.os_id);
    if (!os) throw new Error("OS não encontrada.");

    db.os_itens.splice(idx, 1);

    const totalItens = db.os_itens
      .filter((i) => i.os_id === item.os_id)
      .reduce((sum, i) => sum + Number(i.valor_total ?? 0), 0);

    const mao = Number(os.mao_de_obra ?? 0);

    os.valor_total = Number((totalItens + mao).toFixed(2));
    os.updated_at = nowIso();

    db.os_timeline.push({
      id: uuid(),
      os_id: item.os_id,
      evento: `Item removido: ${item.descricao}`,
      created_at: nowIso(),
      user_id: input.user_id,
    });

    saveDB(db);
    return true;
  },

  removeOSItensByTipo(input: {
    os_id: string;
    tipo: "servico" | "peca";
    user_id?: string;
  }) {
    const db = loadDB();
    const os = db.ordens_servico.find((o) => o.id === input.os_id);
    if (!os) throw new Error("OS não encontrada.");

    const before = db.os_itens.length;
    db.os_itens = db.os_itens.filter(
      (i) => !(i.os_id === input.os_id && i.tipo === input.tipo),
    );
    const removed = before - db.os_itens.length;

    const totalItens = db.os_itens
      .filter((i) => i.os_id === input.os_id)
      .reduce((sum, i) => sum + Number(i.valor_total ?? 0), 0);

    const mao = Number(os.mao_de_obra ?? 0);

    os.valor_total = Number((totalItens + mao).toFixed(2));
    os.updated_at = nowIso();

    db.os_timeline.push({
      id: uuid(),
      os_id: input.os_id,
      evento:
        input.tipo === "peca"
          ? `Peças removidas (${removed})`
          : `Mão de obra (itens) removida (${removed})`,
      created_at: nowIso(),
      user_id: input.user_id,
    });

    saveDB(db);
    return removed;
  },

  clearMaoDeObra(input: { os_id: string; user_id?: string }) {
    const db = loadDB();
    const os = db.ordens_servico.find((o) => o.id === input.os_id);
    if (!os) throw new Error("OS não encontrada.");

    os.mao_de_obra = 0;

    const totalItens = db.os_itens
      .filter((i) => i.os_id === input.os_id)
      .reduce((sum, i) => sum + Number(i.valor_total ?? 0), 0);

    os.valor_total = Number(totalItens.toFixed(2));
    os.updated_at = nowIso();

    db.os_timeline.push({
      id: uuid(),
      os_id: input.os_id,
      evento: "Mão de obra (mecânico) zerada",
      created_at: nowIso(),
      user_id: input.user_id,
    });

    saveDB(db);
    return 0;
  },

  // =========================
  // Detalhes
  // =========================
  getOSDetails(osId: string) {
    const db = loadDB();
    const os = db.ordens_servico.find((o) => o.id === osId);
    if (!os) return null;

    const cliente = db.clientes.find((c) => c.id === os.cliente_id);
    const veiculo = db.veiculos.find((v) => v.id === os.veiculo_id);

    const itens = db.os_itens.filter((i) => i.os_id === osId);
    const checklist = [...db.os_checklist]
      .filter((c) => c.os_id === osId)
      .sort((a, b) => a.ordem - b.ordem);

    const fotos = db.os_fotos.filter((f) => f.os_id === osId);

    const timeline = [...db.os_timeline]
      .filter((t) => t.os_id === osId)
      .sort((a, b) => (a.created_at < b.created_at ? 1 : -1));

    return {
      os: { ...os, cliente, veiculo } as OrdemServico,
      itens,
      checklist,
      fotos,
      timeline,
    };
  },

  toggleChecklist(id: string) {
    const db = loadDB();
    const item = db.os_checklist.find((c) => c.id === id);
    if (!item) return null;

    item.checked = !item.checked;
    saveDB(db);
    return item.checked;
  },

  getOS(id: string): OrdemServico | null {
    const db = loadDB();
    const os = db.ordens_servico.find((o) => o.id === id);
    if (!os) return null;

    const cliente = db.clientes.find((c) => c.id === os.cliente_id);
    const veiculo = db.veiculos.find((v) => v.id === os.veiculo_id);
    const itens = db.os_itens.filter((i) => i.os_id === id);
    const timeline = db.os_timeline.filter((t) => t.os_id === id);

    return {
      ...os,
      cliente,
      veiculo,
      itens,
      timeline,
    } as OrdemServico;
  },

  updateOS(updated: OrdemServico) {
    const db = loadDB();
    const index = db.ordens_servico.findIndex((o) => o.id === updated.id);
    if (index === -1) throw new Error("OS não encontrada para atualização.");

    // Remove relations to avoid cyclic storage if needed
    const { cliente, veiculo, itens, timeline, ...clean } = updated;
    db.ordens_servico[index] = {
      ...db.ordens_servico[index],
      ...clean,
      updated_at: nowIso(),
    };

    saveDB(db);
  },
};
