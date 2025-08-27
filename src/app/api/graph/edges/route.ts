import { NextRequest, NextResponse } from "next/server";
import { requireSession, buildNamespace, runUpdate } from "../_lib/updateGraph";

const escLit = (s: string) => s.replaceAll("\\", "\\\\").replaceAll(`"`, `\\"`);
const iriNs = (ns: string, v: string) =>
  v.startsWith("http") ? `<${v}>` : `<${ns}${encodeURIComponent(v)}>`;

// PATCH /api/graph/edges?graphId=...
export async function PATCH(req: NextRequest) {
  try {
    const session = await requireSession();
    const { searchParams } = new URL(req.url);
    const graphId = searchParams.get("graphId");
    if (!graphId) {
      return NextResponse.json({ error: "Missing graphId" }, { status: 400 });
    }

    const body = await req.json().catch(() => ({}));
    const { mode, sourceId, targetId, predicateId, newPredicateId, label } =
      body as {
        mode?: "replace-predicate" | "relabel";
        sourceId?: string; // S (IRI completo ou local)
        targetId?: string; // O (IRI completo ou local)
        predicateId?: string; // P antigo (IRI completo ou local)
        newPredicateId?: string; // P novo   (IRI completo ou local)
        label?: string; // novo rdfs:label do predicado (opcional)
      };

    if (!mode) {
      return NextResponse.json(
        { error: 'Provide mode: "replace-predicate" or "relabel"' },
        { status: 400 }
      );
    }

    const ns = buildNamespace(session.user.sub, graphId);

    // -------------------------------------------------------
    // mode: replace-predicate  (troca só esta aresta S P O)
    // -------------------------------------------------------
    if (mode === "replace-predicate") {
      if (
        !sourceId?.trim() ||
        !targetId?.trim() ||
        !predicateId?.trim() ||
        !newPredicateId?.trim()
      ) {
        return NextResponse.json(
          { error: "Missing sourceId|targetId|predicateId|newPredicateId" },
          { status: 400 }
        );
      }

      const S = iriNs(ns, sourceId);
      const O = iriNs(ns, targetId);
      const Pold = iriNs(ns, predicateId);
      const Pnew = iriNs(ns, newPredicateId);

      const insertLabel =
        label && label.trim()
          ? `\n  GRAPH <${ns}> { ${Pnew} <http://www.w3.org/2000/01/rdf-schema#label> "${escLit(
              label.trim()
            )}" . }`
          : "";

      // Remove S Pold O (default + named) e insere S Pnew O no <ns>
      const update = `
        DELETE {
          ${S} ${Pold} ${O} .
          GRAPH ?g { ${S} ${Pold} ${O} . }
        }
        INSERT {
          GRAPH <${ns}> { ${S} ${Pnew} ${O} . }${insertLabel}
        }
        WHERE {
          OPTIONAL { ${S} ${Pold} ${O} }
          OPTIONAL { GRAPH ?g { ${S} ${Pold} ${O} } }
        }
      `;
      return await runUpdate(ns, update);
    }

    // -------------------------------------------------------
    // mode: relabel  (só muda o rdfs:label do predicado)
    // -------------------------------------------------------
    if (!predicateId?.trim() || !label?.trim()) {
      return NextResponse.json(
        { error: "Missing predicateId or label" },
        { status: 400 }
      );
    }

    const P = iriNs(ns, predicateId);

    // Remove labels antigos (em qualquer grafo) e grava o novo no <ns>
    const update = `
      PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
      DELETE {
        ${P} rdfs:label ?old .
        GRAPH ?g { ${P} rdfs:label ?old . }
      }
      INSERT {
        GRAPH <${ns}> { ${P} rdfs:label "${escLit(label.trim())}" . }
      }
      WHERE {
        OPTIONAL { ${P} rdfs:label ?old }
        OPTIONAL { GRAPH ?g { ${P} rdfs:label ?old } }
      }
    `;
    return await runUpdate(ns, update);
  } catch (e) {
    if (e instanceof Response) return e;
    console.error("PATCH /edges error:", e);
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await requireSession();
    const { searchParams } = new URL(req.url);
    const graphId = searchParams.get("graphId");
    if (!graphId)
      return NextResponse.json({ error: "Missing graphId" }, { status: 400 });

    const body = await req.json().catch(() => ({}));
    const { sourceId, predicateId, targetId } = body as {
      sourceId?: string;
      predicateId?: string; // IRI do predicado ou id local
      targetId?: string;
    };
    if (!sourceId?.trim() || !predicateId?.trim() || !targetId?.trim()) {
      return NextResponse.json(
        { error: "Missing sourceId|predicateId|targetId" },
        { status: 400 }
      );
    }

    const ns = buildNamespace(session.user.sub, graphId);
    const S = iriNs(ns, sourceId);
    const P = iriNs(ns, predicateId);
    const O = iriNs(ns, targetId);

    const update = `
      DELETE {
        ${S} ${P} ${O} .
        GRAPH ?g { ${S} ${P} ${O} . }
      }
      WHERE {
        OPTIONAL { ${S} ${P} ${O} }
        OPTIONAL { GRAPH ?g { ${S} ${P} ${O} } }
      }
    `;

    return await runUpdate(ns, update);
  } catch (e) {
    if (e instanceof Response) return e;
    console.error("DELETE /edges error:", e);
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}
