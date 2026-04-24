import { NextResponse } from 'next/server';
import { requireDashboardAuth } from '@/lib/adminAuth';
import { getSheets, getSpreadsheetId } from '@/lib/googleSheets';
import { v4 as uuidv4 } from 'uuid';

// Tabela canônica de produtos e quantidades padrão por tipo de cesta
const PRODUTOS_PADRAO = [
  { nome: 'Arroz',           adultos: 5,    kids: 5    },
  { nome: 'Feijão',          adultos: 2,    kids: 2    },
  { nome: 'Açúcar',          adultos: 2,    kids: 2    },
  { nome: 'Macarrão',        adultos: 2,    kids: 2    },
  { nome: 'Farinha de Mesa', adultos: 1,    kids: 1    },
  { nome: 'Farinha de Trigo',adultos: 1,    kids: 1    },
  { nome: 'Fubá',            adultos: 1,    kids: 1    },
  { nome: 'Sal',             adultos: 1,    kids: 1    },
  { nome: 'Café',            adultos: 0.25, kids: 0.25 },
  { nome: 'Milho de Pipoca', adultos: 1,    kids: 1    },
  { nome: 'Óleo',            adultos: 1,    kids: 1    },
  { nome: 'Leite',           adultos: 2,    kids: 2    },
  { nome: 'Leite em Pó',     adultos: 0,    kids: 0    },
  { nome: 'Biscoito Doce',   adultos: 0.4,  kids: 0.4  },
  { nome: 'Biscoito Salgado',adultos: 0.4,  kids: 0.4  },
  { nome: 'Gelatinas',       adultos: 0,    kids: 0    },
  { nome: 'Molho de Tomate', adultos: 0.8,  kids: 0.8  },
  { nome: 'Enlatado',        adultos: 0.5,  kids: 0.5  },
  { nome: 'Achocolatado',    adultos: 0,    kids: 0.5  },
  { nome: 'Mucilon',         adultos: 0,    kids: 0.5  },
] as const;

const SHEET_NAME = 'produtos';
const HEADERS = ['id_produto', 'nome_produto', 'unidade', 'ativo', 'Adultos', 'Kids'] as const;

export async function POST() {
  const unauthorized = await requireDashboardAuth();
  if (unauthorized) return unauthorized;

  try {
    const sheets = await getSheets();
    const spreadsheetId = getSpreadsheetId();

    // Lê estado atual
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${SHEET_NAME}!A:F`,
    });
    const values = res.data.values ?? [];

    // Garante cabeçalhos
    if (values.length === 0 || !values[0].includes('id_produto')) {
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${SHEET_NAME}!A1`,
        valueInputOption: 'RAW',
        requestBody: { values: [HEADERS as unknown as string[]] },
      });
      values.unshift(HEADERS as unknown as string[]);
    }

    const [, ...rows] = values;
    const updated: string[] = [];
    const created: string[] = [];

    for (const produto of PRODUTOS_PADRAO) {
      const idx = rows.findIndex(
        (r) => String(r[1] ?? '').trim().toLowerCase() === produto.nome.toLowerCase()
      );

      if (idx !== -1) {
        // Atualiza apenas as colunas Adultos e Kids, mantém id, unidade e ativo existentes
        const absRow = idx + 2;
        const existingRow = rows[idx];
        await sheets.spreadsheets.values.update({
          spreadsheetId,
          range: `${SHEET_NAME}!A${absRow}:F${absRow}`,
          valueInputOption: 'USER_ENTERED',
          requestBody: {
            values: [[
              existingRow[0] ?? uuidv4().slice(0, 8).toUpperCase(),
              produto.nome,
              existingRow[2] ?? 'kg',
              existingRow[3] ?? 'true',
              produto.adultos,
              produto.kids,
            ]],
          },
        });
        updated.push(produto.nome);
      } else {
        // Cria novo produto com as quantidades padrão
        await sheets.spreadsheets.values.append({
          spreadsheetId,
          range: `${SHEET_NAME}!A:F`,
          valueInputOption: 'USER_ENTERED',
          requestBody: {
            values: [[
              uuidv4().slice(0, 8).toUpperCase(),
              produto.nome,
              'kg',
              'true',
              produto.adultos,
              produto.kids,
            ]],
          },
        });
        created.push(produto.nome);
      }
    }

    return NextResponse.json({
      success: true,
      total: PRODUTOS_PADRAO.length,
      updated: updated.length,
      created: created.length,
      updatedList: updated,
      createdList: created,
    });
  } catch (err) {
    console.error('[POST /api/produtos/seed]', err);
    return NextResponse.json({ error: 'Erro ao popular produtos' }, { status: 500 });
  }
}
