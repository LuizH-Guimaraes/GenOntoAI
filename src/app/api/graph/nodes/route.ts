import { NextRequest, NextResponse } from "next/server";
import { requireSession, buildNamespace, runUpdate } from "../_lib/updateGraph";

// Helpers
const escLit = (s: string) => s.replaceAll("\\", "\\\\").replaceAll(`"`, `\\"`);
const iriNs = (ns: string, localOrIri: string) =>
  localOrIri.startsWith("http")
    ? `<${localOrIri}>`
    : `<${ns}${encodeURIComponent(localOrIri)}>`;
const iriAbs = (v: string) => (v.startsWith("http") ? `<${v}>` : null);

type InsertTriple =
  | { p: string; o: string; type: "iri" }
  | { p: string; o: string; type: "literal"; lang?: string };

export async function PATCH(req: NextRequest) {
  try {
    const session = await requireSession();
    const { searchParams } = new URL(req.url);
    const graphId = searchParams.get("graphId");
    if (!graphId) {
      return NextResponse.json({ error: "Missing graphId" }, { status: 400 });
    }

    const body = await req.json().catch(() => ({}));
    const { mode, id, newId, label, inserts, direction, targetId } = body as {
      mode?: "rename" | "replace";
      id?: string; // IRI completo ou id local
      newId?: string; // novo id local (ou IRI completo) para rename
      label?: string; // (opcional) novo rdfs:label no rename
      inserts?: InsertTriple[]; // para replace
      direction?: "outbound" | "both"; // para replace (padrão outbound)
      targetId?: string; // para replace: escrever em id diferente
    };

    if (!id?.trim()) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }
    if (mode !== "rename" && mode !== "replace") {
      return NextResponse.json(
        { error: 'Provide mode: "rename" or "replace"' },
        { status: 400 }
      );
    }

    const ns = buildNamespace(session.user.sub, graphId);

    // --------------------------
    // RENAME: move old -> new
    // --------------------------
    if (mode === "rename") {
      if (!newId?.trim())
        return NextResponse.json(
          { error: "Missing newId for rename" },
          { status: 400 }
        );

      const oldIRI = iriNs(ns, id);
      const newIRI = iriNs(ns, newId);

      // Se não mudou o IRI, só (opcionalmente) atualiza o label no <ns>
      if (oldIRI === newIRI) {
        if (!label?.trim())
          return NextResponse.json({ ok: true, note: "No changes" });
        const updateNoMove = `
          PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
          WITH <${ns}>
          DELETE { ${newIRI} rdfs:label ?old }
          INSERT { ${newIRI} rdfs:label "${escLit(label.trim())}" }
          WHERE  { OPTIONAL { ${newIRI} rdfs:label ?old } }
        `;
        const res = await runUpdate(ns, updateNoMove);
        return res;
      }

      // Versão robusta: pega default graph E grafos nomeados; regrava tudo em <ns>
      const update = `
        PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>

        DELETE {
          # default graph
          ${oldIRI} ?p ?o .
          ?s ?p2 ${oldIRI} .
          ${label?.trim() ? `${newIRI} rdfs:label ?oldNewLabel .` : ""}

          # named graphs
          GRAPH ?g { ${oldIRI} ?p ?o . }
          GRAPH ?g { ?s ?p2 ${oldIRI} . }
          ${
            label?.trim()
              ? `GRAPH ?g { ${newIRI} rdfs:label ?oldNewLabel . }`
              : ""
          }
        }
        INSERT {
          GRAPH <${ns}> { ${newIRI} ?p ?o . }
          GRAPH <${ns}> { ?s ?p2 ${newIRI} . }
          ${
            label?.trim()
              ? `GRAPH <${ns}> { ${newIRI} rdfs:label "${escLit(
                  label.trim()
                )}" . }`
              : ""
          }
        }
        WHERE {
          # default graph
          { ${oldIRI} ?p ?o } 
          UNION
          { ?s ?p2 ${oldIRI} }

          # named graphs
          UNION
          { GRAPH ?g { ${oldIRI} ?p ?o } }
          UNION
          { GRAPH ?g { ?s ?p2 ${oldIRI} } }

          ${
            label?.trim()
              ? `
          OPTIONAL { ${newIRI} rdfs:label ?oldNewLabel }
          OPTIONAL { GRAPH ?g { ${newIRI} rdfs:label ?oldNewLabel } }
            `
              : ""
          }
        }
      `;
      return await runUpdate(ns, update);
    }

    // --------------------------
    // REPLACE: apaga e reescreve
    // --------------------------
    if (!Array.isArray(inserts) || inserts.length === 0) {
      return NextResponse.json({ error: "Missing inserts[]" }, { status: 400 });
    }

    const sDelete = iriNs(ns, id);
    const sInsert = targetId ? iriNs(ns, targetId) : sDelete;
    const dir = direction ?? "outbound";

    // Monta INSERTs
    const insertLines = inserts
      .map((t) => {
        const pIri = iriAbs(t.p) ?? iriNs(ns, t.p);
        if (t.type === "iri") {
          const oIri = iriAbs(t.o) ?? iriNs(ns, t.o);
          return `  ${sInsert} ${pIri} ${oIri} .`;
        } else {
          const lit = `"${escLit(String(t.o))}"${t.lang ? `@${t.lang}` : ""}`;
          return `  ${sInsert} ${pIri} ${lit} .`;
        }
      })
      .join("\n");

    // DELETE em default + named graphs; INSERT no <ns>
    const delDefault =
      dir === "both"
        ? `${sDelete} ?p ?o .\n          ?s ?p2 ${sDelete} .`
        : `${sDelete} ?p ?o .`;

    const whereDefault =
      dir === "both"
        ? `OPTIONAL { ${sDelete} ?p ?o } OPTIONAL { ?s ?p2 ${sDelete} }`
        : `OPTIONAL { ${sDelete} ?p ?o }`;

    const update = `
      DELETE {
        # default graph
        ${delDefault}
        # named graphs
        GRAPH ?g { ${delDefault} }
      }
      INSERT {
        GRAPH <${ns}> {
${insertLines}
        }
      }
      WHERE {
        # default graph
        ${whereDefault}
        # named graphs
        UNION { GRAPH ?g { ${sDelete} ?p ?o } }
        ${dir === "both" ? `UNION { GRAPH ?g { ?s ?p2 ${sDelete} } }` : ""}
      }
    `;
    return await runUpdate(ns, update);
  } catch (e) {
    if (e instanceof Response) return e;
    console.error("PATCH /nodes error:", e);
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}

// Escopos possíveis de deleção do nó
type Scope = "outbound" | "inbound" | "both";

export async function DELETE(req: NextRequest) {
  try {
    const session = await requireSession();
    const { searchParams } = new URL(req.url);
    const graphId = searchParams.get("graphId");
    if (!graphId) {
      return NextResponse.json({ error: "Missing graphId" }, { status: 400 });
    }

    const body = await req.json().catch(() => ({}));
    const { id, scope } = body as { id?: string; scope?: Scope };

    if (!id?.trim()) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }

    const ns = buildNamespace(session.user.sub, graphId);
    const S = iriNs(ns, id);
    const s: Scope = scope ?? "both";

    // Partes para montar DELETE/WHERE conforme escopo
    const delDefaultOutbound = `${S} ?p ?o .`;
    const delDefaultInbound = `?s ?p2 ${S} .`;
    const delNamedOutbound = `GRAPH ?g { ${S} ?p ?o . }`;
    const delNamedInbound = `GRAPH ?g { ?s ?p2 ${S} . }`;

    const whereDefaultOutbound = `OPTIONAL { ${S} ?p ?o }`;
    const whereDefaultInbound = `OPTIONAL { ?s ?p2 ${S} }`;
    const whereNamedOutbound = `OPTIONAL { GRAPH ?g { ${S} ?p ?o } }`;
    const whereNamedInbound = `OPTIONAL { GRAPH ?g { ?s ?p2 ${S} } }`;

    const delParts = [
      (s === "outbound" || s === "both") && delDefaultOutbound,
      (s === "inbound" || s === "both") && delDefaultInbound,
      (s === "outbound" || s === "both") && delNamedOutbound,
      (s === "inbound" || s === "both") && delNamedInbound,
    ]
      .filter(Boolean)
      .join("\n  ");

    const whereParts = [
      (s === "outbound" || s === "both") && whereDefaultOutbound,
      (s === "inbound" || s === "both") && whereDefaultInbound,
      (s === "outbound" || s === "both") && whereNamedOutbound,
      (s === "inbound" || s === "both") && whereNamedInbound,
    ]
      .filter(Boolean)
      .join("\n  ");

    const update = `
      DELETE {
        ${delParts}
      }
      WHERE {
        ${whereParts}
      }
    `;

    return await runUpdate(ns, update);
  } catch (e) {
    if (e instanceof Response) return e;
    console.error("DELETE /nodes error:", e);
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}
