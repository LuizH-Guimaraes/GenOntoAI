import { User } from "@auth0/nextjs-auth0/types";
import { RelationshipEntity } from "@/app/_models/relationship";
import { toCamelCase } from "@/lib/stringFormatter";

export async function handleInsert(
  relationship: RelationshipEntity,
  user: User,
  id: string
) {
  if (!user) return alert("User not authenticated.");

  const graphId = id;
  const auth0Id = user.sub.replace("|", "-");
  const namespace = `http://genontoai.com/${auth0Id}/${graphId}/`;

  const subject = toCamelCase(relationship.subject?.trim());
  const predicate = toCamelCase(relationship.relationship?.trim());
  const object = toCamelCase(relationship.object?.trim());

  if (!subject || !predicate || !object) {
    return alert("Invalid relationship data.");
  }

  const formattedSubject = `<${namespace}${subject}>`;
  const formattedObject = `<${namespace}${object}>`;
  const formattedPredicate = `<${namespace}${predicate.trim()}>`;

  const updateQuery = `
      PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
      PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
      PREFIX owl: <http://www.w3.org/2002/07/owl#>
      INSERT DATA {
        ${formattedSubject} ${formattedPredicate} ${formattedObject} .
      }
    `;

  try {
    const response = await fetch(`/api/graph/insert?graphId=${graphId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ updateQuery }),
    });

    const json = await response.json();

    if (!response.ok) throw new Error(json.error);
  } catch (error) {
    console.error("Insert failed:", error);
  }
}

export async function handleInsertMany(
  relationships: RelationshipEntity[],
  user: User,
  id: string
) {
  if (!user) {
    alert("User not authenticated.");
    return;
  }

  const graphId = id;
  const auth0Id = user.sub.replace("|", "-");
  const namespace = `http://genontoai.com/${auth0Id}/${graphId}/`;

  const prefix = `
    PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
    PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
    PREFIX owl: <http://www.w3.org/2002/07/owl#>
  `;

  // Gera as triples para todos os relacionamentos válidos
  const triples = relationships
    .filter(
      (rel) =>
        rel.subject?.trim() && rel.relationship?.trim() && rel.object?.trim()
    )
    .map((rel) => {
      const subject = `<${namespace}${encodeURIComponent(
        toCamelCase(rel.subject.trim())
      )}>`;
      const predicate = `<${namespace}${toCamelCase(rel.relationship.trim())}>`;
      const object = `<${namespace}${encodeURIComponent(
        toCamelCase(rel.object.trim())
      )}>`;
      return `${subject} ${predicate} ${object} .`;
    });

  if (triples.length === 0) {
    alert("No valid relationships to insert.");
    return;
  }

  const updateQuery = `${prefix}\nINSERT DATA {\n${triples.join("\n")}\n}`;

  try {
    const response = await fetch(`/api/graph/insert?graphId=${graphId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ updateQuery }),
    });

    const json = await response.json();

    if (!response.ok) throw new Error(json.error);

    alert("All relationships inserted successfully!");
  } catch (error) {
    console.error("Insert failed:", error);
    alert("Failed to insert relationships.");
  }
}
