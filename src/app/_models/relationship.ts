export type RelationshipEntity = {
  id?: number;
  subject: string;
  relationship: string;
  object: string;
};

export function parseSVOListToRelationships(
  svoList: string[]
): RelationshipEntity[] {
  return svoList.map((line, index) => {
    const parts = line.split("|").map((part) => part.trim());

    return {
      id: index,
      subject: parts[0],
      relationship: parts[1],
      object: parts[2],
    };
  });
}
