export const relationshipOptions = [
  {
    label: "Basic Relationships",
    options: [
      { value: "rdfs:subClassOf", label: "Subclass of (rdfs:subClassOf)" },
      {
        value: "rdfs:subPropertyOf",
        label: "Subproperty of (rdfs:subPropertyOf)",
      },
      { value: "rdf:type", label: "Type of (rdf:type)" },
    ],
  },
  {
    label: "Equivalence and Identity",
    options: [
      {
        value: "owl:equivalentClass",
        label: "Equivalent Class (owl:equivalentClass)",
      },
      {
        value: "owl:equivalentProperty",
        label: "Equivalent Property (owl:equivalentProperty)",
      },
      { value: "owl:sameAs", label: "Same as (owl:sameAs)" },
    ],
  },
  {
    label: "Entity Relationships",
    options: [
      { value: "owl:inverseOf", label: "Inverse of (owl:inverseOf)" },
      { value: "owl:disjointWith", label: "Disjoint with (owl:disjointWith)" },
    ],
  },
  {
    label: "Property Constraints",
    options: [
      {
        value: "owl:FunctionalProperty",
        label: "Functional Property (owl:FunctionalProperty)",
      },
      {
        value: "owl:InverseFunctionalProperty",
        label: "Inverse Functional Property (owl:InverseFunctionalProperty)",
      },
      {
        value: "owl:TransitiveProperty",
        label: "Transitive Property (owl:TransitiveProperty)",
      },
      {
        value: "owl:SymmetricProperty",
        label: "Symmetric Property (owl:SymmetricProperty)",
      },
      {
        value: "owl:AsymmetricProperty",
        label: "Asymmetric Property (owl:AsymmetricProperty)",
      },
    ],
  },
  {
    label: "Value Constraints",
    options: [
      { value: "owl:hasValue", label: "Has Value (owl:hasValue)" },
      {
        value: "owl:someValuesFrom",
        label: "Some Values From (owl:someValuesFrom)",
      },
      {
        value: "owl:allValuesFrom",
        label: "All Values From (owl:allValuesFrom)",
      },
    ],
  },
];
