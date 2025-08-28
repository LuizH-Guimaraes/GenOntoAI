export function cleanLabel(uri: string): string {
  const knownPrefixes: { [key: string]: string } = {
    "http://www.w3.org/1999/02/22-rdf-syntax-ns#": "rdf:",
    "http://www.w3.org/2000/01/rdf-schema#": "rdfs:",
    "http://www.w3.org/2002/07/owl#": "owl:",
  };

  for (const [full, prefix] of Object.entries(knownPrefixes)) {
    if (uri.startsWith(full)) {
      return prefix + uri.slice(full.length);
    }
  }

  const hashIndex = uri.lastIndexOf("#");
  const slashIndex = uri.lastIndexOf("/");

  if (hashIndex !== -1) return uri.slice(hashIndex + 1);
  if (slashIndex !== -1) return uri.slice(slashIndex + 1);
  return uri;
}

export function toCamelCase(text: string): string {
  return text
    .toLowerCase()
    .split(/[\s_]+/)
    .map((word, index) =>
      index === 0 ? word : word[0].toUpperCase() + word.slice(1)
    )
    .join("");
}

export function getLocalIdFromIri(iri: string) {
  const i = iri.lastIndexOf("/");
  return i >= 0 ? decodeURIComponent(iri.slice(0, i + 1)) : "";
}
